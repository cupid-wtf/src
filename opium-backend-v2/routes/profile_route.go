package routes

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
)

func GetProfileHandler(c *fiber.Ctx) error {
	url := c.Params("url")
	if url == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "URL is required",
		})
	}
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	var user models.User
	err := collection.FindOne(ctx, bson.M{"url": url}).Decode(&user)
	if err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error": "User not found",
		})
	}
	return c.JSON(fiber.Map{
		"username": user.Username,
		"url":      user.URL,
		"uid":      user.UID,
		"views":    user.Views,
		"config":   user.Config,
		"effects": fiber.Map{
			"avatar_decoration": user.Config.Effects.PfpDecor,
			"glow":              user.Config.Effects.Glow,
		},
		"discord": fiber.Map{
			"id":     user.Discord.ID,
			"invite": nil,
		},
	})
}
