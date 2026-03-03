package routes

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
)

type VerifyRequest struct {
	Token string `json:"token" validate:"required"`
}

func VerifyEmailHandler(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var req VerifyRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid input",
			"issues":  []fiber.Map{{"message": "Invalid request body"}},
		})
	}

	if req.Token == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid input",
			"issues":  []fiber.Map{{"message": "Token must be a non-empty string"}},
		})
	}

	var user models.User
	err := collection.FindOne(ctx, bson.M{
		"emailVerificationtoken": req.Token,
		"emailVerified":          false,
	}).Decode(&user)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "Invalid or expired verification token",
		})
	}

	updateDoc := bson.M{
		"$set": bson.M{
			"emailVerified":          true,
			"emailVerificationtoken": nil,
		},
	}

	_, err = collection.UpdateOne(
		ctx,
		bson.M{"_id": user.ID},
		updateDoc,
	)

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "Something went wrong",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":  "Email verified successfully",
		"verified": true,
	})
}
