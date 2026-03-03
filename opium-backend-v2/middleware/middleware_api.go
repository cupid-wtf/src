package middleware

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
)

func APIKeyAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "Authorization header is required",
			})
		}
		var apiKey string
		if strings.HasPrefix(authHeader, "Bearer ") {
			apiKey = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			apiKey = authHeader
		}
		if apiKey == "" {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"message": "API key cannot be empty",
			})
		}
		mongodb.Init()
		collection := mongodb.DB.Collection("users")
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		count, err := collection.CountDocuments(ctx, bson.M{"api_key": apiKey})
		if err != nil || count == 0 {
			return c.Status(401).JSON(fiber.Map{
				"success": false,
				"message": "Invalid API key",
			})
		}
		return c.Next()
	}
}
