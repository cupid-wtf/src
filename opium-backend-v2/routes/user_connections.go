package routes

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/config"
	"github.com/opium-bio/backend-v2/utils/discord"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
)

func ConnectDiscord(c *fiber.Ctx) error {
	cfg, err := config.Load("config.toml")
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	var redirectURL string
	//get profile
	if cfg.Server.Profile == "development" {
		redirectURL = "http://localhost:3000/"
	} else {
		redirectURL = "https://cupid.wtf/"
	}

	code := c.Query("code")
	if code == "" {
		return c.Status(400).JSON(fiber.Map{
			"error": "Missing authorization code",
		})
	}

	// Get user from middleware
	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}

	token, err := discord.ConnectDiscord(code)
	if err != nil {
		log.Printf("Error getting Discord token: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to connect to Discord",
		})
	}

	user, err := discord.GetUserInfo(token.AccessToken)
	if err != nil {
		log.Printf("Error getting Discord user info: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to get user information",
		})
	}
	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateDoc := bson.M{
		"$set": bson.M{
			"discord.id":              user.ID,
			"discord.connection_date": time.Now(),
			"discord.enabled":         true,
		},
	}

	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, updateDoc)
	if err != nil {
		log.Printf("Error updating user Discord ID: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"error": "Failed to save Discord connection",
		})
	}

	log.Printf("Successfully connected Discord user: %s", user.ID)

	return c.Redirect(redirectURL)
}

func ResetDiscord(c *fiber.Ctx) error {
	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}

	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	updateDoc := bson.M{
		"$unset": bson.M{
			"discord.id":              nil,
			"discord.connection_date": nil,
		},
		"$set": bson.M{
			"discord.enabled": false,
		},
	}

	_, err := usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, updateDoc)
	if err != nil {
		log.Printf("Error resetting Discord connection: %v", err)
		return c.Status(500).JSON(fiber.Map{
			"success": false,
			"message": "Failed to reset Discord connection",
		})
	}

	log.Printf("Successfully reset Discord connection for user: %v", middlewareUser.ID)

	return c.Status(200).JSON(fiber.Map{
		"success": true,
		"message": "Discord connection reset successfully",
	})
}

func InitDiscordOAuth(c *fiber.Ctx) error {
	cfg, err := config.Load("config.toml")
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}

	clientID := cfg.Discord.ClientId
	redirectURI := "https://api.cupid.wtf/v2/discord/callback"
	discordURL := "https://discord.com/api/oauth2/authorize?" +
		"client_id=" + clientID +
		"&redirect_uri=" + redirectURI +
		"&response_type=code" +
		"&scope=identify"
	return c.Redirect(discordURL)
}
