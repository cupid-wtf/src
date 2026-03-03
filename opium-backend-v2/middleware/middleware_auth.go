package middleware

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/config"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func CreateTokens(userid string, sessionid string) (string, string, error) {
	config, err := config.Load("config.toml")
	if err != nil {
		log.Fatalln("Unable to load config")
	}
	var jwtSecret = []byte(config.JWT.SigningKey)
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := jwt.MapClaims{
		"id":  userid,
		"exp": expirationTime.Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", "", fmt.Errorf("failed to sign token: %w", err)
	}
	return tokenString, sessionid, nil
}

func AuthMiddleware(c *fiber.Ctx) error {
	cfg, err := config.Load("config.toml")
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Internal server error",
		})
	}
	tokenString := c.Cookies("token")
	sessionID := c.Cookies("session")
	if tokenString == "" || sessionID == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	if !mongodb.Init() {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	jwtSecret := []byte(cfg.JWT.SigningKey)
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtSecret, nil
	})
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["id"] == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized (invalid claims)",
		})
	}

	userID, err := primitive.ObjectIDFromHex(claims["id"].(string))
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	users := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err = users.FindOne(ctx, bson.M{
		"_id":       userID,
		"sessionid": sessionID,
	}).Decode(&user)

	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	c.Locals("user", user)
	c.Locals("userID", user.ID.Hex())

	return c.Next()
}
