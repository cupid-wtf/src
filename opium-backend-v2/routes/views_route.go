package routes

import (
	"context"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/cloudflare"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type ViewsRequest struct {
	Url        string `json:"url" validate:"required,url"`
	Cloudflare string `json:"cloudflare" validate:"required"`
}

func ProfileView(c *fiber.Ctx) error {
	var request ViewsRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	valid, err := cloudflare.VerifyTurnstileToken(request.Cloudflare)
	if err != nil || !valid {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "Invalid Turnstile token",
		})
	}

	ip := c.Get("CF-Connecting-IP")
	if ip == "" {
		ip = c.IP()
	}
	if ip == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Unable to determine IP address",
		})
	}

	mongodb.Init()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	usersCollection := mongodb.DB.Collection("users")
	viewsCollection := mongodb.DB.Collection("views")

	var user models.User
	err = usersCollection.FindOne(ctx, bson.M{"url": request.Url}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"message": "User not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to query user",
		})
	}

	onedayAgo := time.Now().Add(-24 * time.Hour)
	filter := bson.M{
		"user_id":   user.ID,
		"ip":        ip,
		"viewed_at": bson.M{"$gt": onedayAgo},
	}

	count, err := viewsCollection.CountDocuments(ctx, filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to check previous views",
		})
	}

	if count > 0 {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"message": "View already recorded recently from this IP",
		})
	}

	view := models.View{
		UserID:    user.ID,
		IP:        ip,
		UserAgent: c.Get("User-Agent"),
		ViewedAt:  time.Now(),
	}

	_, err = viewsCollection.InsertOne(ctx, view)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to record view",
		})
	}

	today := time.Now().UTC().Truncate(24 * time.Hour)
	userFilter := bson.M{"_id": user.ID}

	var existingUser models.User
	err = usersCollection.FindOne(ctx, bson.M{"_id": user.ID, "views.date": today}).Decode(&existingUser)

	if err == nil {
		for i, view := range user.Views {
			if view.Date.Equal(today) {
				currentViews := 0
				if view.Views != "" {
					if parsed, parseErr := strconv.Atoi(view.Views); parseErr == nil {
						currentViews = parsed
					}
				}
				newViews := currentViews + 1

				update := bson.M{
					"$set": bson.M{
						"views." + strconv.Itoa(i) + ".views": strconv.Itoa(newViews),
					},
				}
				_, err = usersCollection.UpdateOne(ctx, userFilter, update)
				if err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
						"success": false,
						"message": "Failed to update user views",
					})
				}
				break
			}
		}
	} else {
		update := bson.M{
			"$push": bson.M{
				"views": models.Views{
					Date:  today,
					Views: "1",
				},
			},
		}
		_, err = usersCollection.UpdateOne(ctx, userFilter, update)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Failed to update user views",
			})
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
	})
}
