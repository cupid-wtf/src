package routes

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/opium-bio/backend-v2/middleware"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/cloudflare"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Identifier string `json:"identifier" validate:"required,identifier,min=0,max=16"`
	Cloudflare string `json:"cloudflare" validate:"required"`
	Password   string `json:"password" validate:"required,min=8,max=150"`
}

func LoginRoute(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}
	isValid, err := cloudflare.VerifyTurnstileToken(req.Cloudflare)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to verify captcha",
		})
	}
	if !isValid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid captcha verification",
		})
	}
	//connect to database and validate user credentials
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	var user models.User
	err = collection.FindOne(ctx, bson.M{"username": req.Identifier}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid identifier or password",
		})
	}
	if !user.EmailVerified {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Email not verified. Please check your inbox.",
		})
	}
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Invalid identifier or password",
		})
	}
	ipHash := hashIP(c.IP())
	collection.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{"$addToSet": bson.M{"ips": ipHash}},
	)
	//store last login date
	now := time.Now()
	user.LastLoginDate = &now
	collection.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"lastLoginDate": now}},
	)
	//random string as a sessionid
	sessionid := uuid.NewString()
	accessToken, sessionToken, err := middleware.CreateTokens(user.ID.Hex(), sessionid)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Token generation failed",
		})
	}
	//save sessionid
	_, err = collection.UpdateOne(ctx,
		bson.M{"_id": user.ID},
		bson.M{"$set": bson.M{"sessionid": sessionid}},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Session ID update failed",
		})
	}
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    accessToken,
		Expires:  time.Now().Add(24 * time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    sessionToken,
		Expires:  time.Now().Add(24 * time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Welcome back, " + req.Identifier,
	})
}
