package routes

import (
	"context"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func LeaderboardHandler(c *fiber.Ctx) error {
	mongodb.Init()
	collection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{Key: "$addFields", Value: bson.D{
			{Key: "total_views", Value: bson.D{
				{Key: "$sum", Value: bson.D{
					{Key: "$map", Value: bson.D{
						{Key: "input", Value: "$views"},
						{Key: "as", Value: "view"},
						{Key: "in", Value: bson.D{
							{Key: "$toInt", Value: bson.D{
								{Key: "$ifNull", Value: bson.A{"$$view.views", "0"}},
							}},
						}},
					}},
				}},
			}},
		}}},
		{{Key: "$sort", Value: bson.D{
			{Key: "total_views", Value: -1},
		}}},
		{{Key: "$limit", Value: 100}},
		{{Key: "$project", Value: bson.D{
			{Key: "username", Value: 1},
			{Key: "url", Value: 1},
			{Key: "uid", Value: 1},
			{Key: "config.avatar", Value: 1},
			{Key: "total_views", Value: 1},
		}}},
	}

	cursor, err := collection.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to aggregate leaderboard",
		})
	}
	defer cursor.Close(ctx)

	var leaderboard []bson.M
	if err := cursor.All(ctx, &leaderboard); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to decode leaderboard",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    leaderboard,
	})
}
