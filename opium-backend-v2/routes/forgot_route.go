package routes

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/mailgun"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"github.com/opium-bio/backend-v2/utils/validator"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

type ForgotPasswordRequest struct {
	Email      string `json:"email" validate:"required,email"`
	Cloudflare string `json:"cloudflare" validate:"required"`
}

func ForgotPassword(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var request ForgotPasswordRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if err := validator.Validate.Struct(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed: invalid email format.",
		})
	}

	user := models.User{}
	err := collection.FindOne(ctx, bson.M{"email": request.Email}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	resetToken := make([]byte, 16)
	if _, err := rand.Read(resetToken); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate reset token",
		})
	}
	resetTokenHex := hex.EncodeToString(resetToken)

	update := bson.M{
		"$set": bson.M{
			"reset_token":   resetTokenHex,
			"reset_expires": time.Now().Add(1 * time.Hour),
		},
	}

	if _, err = collection.UpdateOne(ctx, bson.M{"_id": user.ID}, update); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update user with reset token",
		})
	}
	resetLink := "https://cupid.wtf/reset-password?code=" + resetTokenHex
	htmlBody := "<html><body>" +
		"<p>You requested a password reset.</p>" +
		"<p>Use the following link to reset your password:</p>" +
		"<p><a href='" + resetLink + "'>Reset your password</a></p>" +
		"<p>If you did not request this, please ignore this email.</p>" +
		"</body></html>"
	err = mailgun.SendEmail(
		"Password Reset Request",
		user.Email,
		"no-reply@cupid.wtf",
		htmlBody,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send reset email",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
	})
}

func ValidateResetCode(c *fiber.Ctx) error {
	resetToken := c.Query("token")
	if resetToken == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Missing reset token",
		})
	}

	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err := collection.FindOne(ctx, bson.M{"reset_token": resetToken}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "Invalid or expired reset token",
		})
	}

	if user.ResetExpires == nil || user.ResetExpires.Before(time.Now()) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Reset token has expired",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
	})
}

func ResetPassword(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var request struct {
		Token    string `json:"token" validate:"required"`
		Password string `json:"password" validate:"required,min=8"`
	}
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	if err := validator.Validate.Struct(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed: invalid token or password.",
		})
	}

	var user models.User
	err := collection.FindOne(ctx, bson.M{"reset_token": request.Token}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "Invalid or expired reset token",
		})
	}

	if user.ResetExpires == nil || user.ResetExpires.Before(time.Now()) {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Reset token has expired",
		})
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), 12)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to hash password",
		})
	}

	update := bson.M{
		"$set": bson.M{
			"password":      hashedPassword,
			"reset_token":   nil,
			"reset_expires": nil,
		},
	}

	if _, err = collection.UpdateOne(ctx, bson.M{"_id": user.ID}, update); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update user password",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
	})
}
