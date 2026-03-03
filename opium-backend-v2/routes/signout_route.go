package routes

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
)

func SignOutRoute(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized",
		})
	}
	updateDoc := bson.M{
		"$set": bson.M{
			"sessionid": "",
		},
	}
	_, err := collection.UpdateOne(
		ctx,
		bson.M{"_id": middlewareUser.ID},
		updateDoc,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Internal Server Error",
		})
	}
	c.Cookie(&fiber.Cookie{
		Name:     "token",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})

	c.Cookie(&fiber.Cookie{
		Name:     "session",
		Value:    "",
		Expires:  time.Now().Add(-time.Hour),
		HTTPOnly: true,
		Secure:   true,
		SameSite: "Lax",
	})
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Successfully signed out",
	})
}
