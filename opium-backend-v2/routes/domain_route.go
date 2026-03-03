package routes

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/cloudflare"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Request struct {
	Domain string `json:"domain"`
}

func AddDomainHamdler(c *fiber.Ctx) error {
	var request Request
	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}
	mongodb.Init()
	collection := mongodb.DB.Collection("domains")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := collection.FindOne(ctx, bson.M{"domain": request.Domain}).Err(); err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Domain already exists",
		})
	}
	domain := models.Domain{
		ID:        primitive.NewObjectID(),
		Domain:    request.Domain,
		Status:    "Pending",
		Donated:   true,
		AddedBy:   middlewareUser.ID.Hex(),
		DateAdded: time.Now(),
	}
	err := cloudflare.Create_Domain(request.Domain)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create domain",
		})
	}
	if _, err := collection.InsertOne(ctx, domain); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to save domain",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Your domain has successfully been added and is pending approval.",
		"domain":  domain.Domain,
	})
}

func ListDomainsHandler(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("domains")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := collection.Find(ctx, bson.M{})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch domains",
		})
	}
	defer cursor.Close(ctx)
	var domains []models.Domain
	if err := cursor.All(ctx, &domains); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Error decoding domains",
		})
	}
	userCollection := mongodb.DB.Collection("users")
	var domainsWithUserInfo []fiber.Map
	for _, domain := range domains {
		userID, err := primitive.ObjectIDFromHex(domain.AddedBy)
		if err != nil {
			continue
		}
		var user models.User
		err = userCollection.FindOne(ctx, bson.M{"_id": userID}).Decode(&user)
		domainData := fiber.Map{
			"_id":       domain.ID,
			"domain":    domain.Domain,
			"donated":   domain.Donated,
			"status":    domain.Status,
			"addedBy":   domain.AddedBy,
			"dateAdded": domain.DateAdded,
		}
		if err == nil {
			domainData["addedUrl"] = user.URL
			domainData["addedUsername"] = user.Username
		}
		domainsWithUserInfo = append(domainsWithUserInfo, domainData)
	}
	return c.JSON(fiber.Map{
		"success": true,
		"domains": fiber.Map{
			"total": len(domainsWithUserInfo),
			"data":  domainsWithUserInfo,
		},
	})
}
