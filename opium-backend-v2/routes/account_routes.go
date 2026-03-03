package routes

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"github.com/opium-bio/backend-v2/utils/validator"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

type InfoUpdaterRequest struct {
	Username string `json:"username" validate:"required,min=3,max=16,safechars"`
	Email    string `json:"email" validate:"required,email"`
	Url      string `json:"url" validate:"required,min=3,max=16,safechars"`
}

type PasswordUpdateRequest struct {
	CurrentPassword string `json:"current_password" validate:"required,min=8,max=150"`
	NewPassword     string `json:"new_password" validate:"required,min=8,max=150"`
}

func InfoUpdater(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var request InfoUpdaterRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	request.Username = strings.TrimSpace(request.Username)
	request.Url = strings.TrimSpace(request.Url)
	request.Email = strings.TrimSpace(request.Email)

	if err := validator.Validate.Struct(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed: only letters, numbers, and underscores allowed for username and url.",
			"errors":  err.Error(),
		})
	}

	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}

	var user models.User
	err := collection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}

	countUsername, err := collection.CountDocuments(ctx, bson.M{
		"username": request.Username,
		"_id":      bson.M{"$ne": middlewareUser.ID},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error checking username",
		})
	}
	if countUsername > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Username is already taken",
		})
	}

	countUrl, err := collection.CountDocuments(ctx, bson.M{
		"url": request.Url,
		"_id": bson.M{"$ne": middlewareUser.ID},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error checking URL",
		})
	}
	if countUrl > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "URL is already taken",
		})
	}

	updateDoc := bson.M{
		"$set": bson.M{
			"username":   request.Username,
			"email":      request.Email,
			"url":        request.Url,
			"updated_at": time.Now(),
		},
	}

	result, err := collection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, updateDoc)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Account updated successfully",
	})
}

func ChangePasswordHandler(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	var req PasswordUpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Current password and new password are required",
		})
	}
	if len(req.NewPassword) < 8 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "New password must be at least 8 characters long",
		})
	}

	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	var user models.User
	err := collection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Current password is incorrect",
		})
	}
	hashedNewPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to process new password",
		})
	}
	updateDoc := bson.M{
		"$set": bson.M{
			"password":   string(hashedNewPassword),
			"updated_at": time.Now(),
		},
	}
	result, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": middlewareUser.ID},
		updateDoc,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Password updated successfully",
	})
}

// func DeleteAccount(c *fiber.Ctx) error {

// }

func RefreshAPIKey(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	apiKeyBytes := make([]byte, 25)
	_, err := rand.Read(apiKeyBytes)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate API key",
		})
	}
	apiKey := hex.EncodeToString(apiKeyBytes)
	updateDoc := bson.M{
		"$set": bson.M{
			"api_key":    apiKey,
			"updated_at": time.Now(),
		},
	}
	result, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": middlewareUser.ID},
		updateDoc,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "API key refreshed successfully",
		"key":     apiKey,
	})
}
