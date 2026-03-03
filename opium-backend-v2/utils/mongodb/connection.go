package mongodb

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/opium-bio/backend-v2/utils/config"
)

var DB *mongo.Database

func Init() bool {
	config, err := config.Load("config.toml")
	if err != nil {
		log.Fatalln("Unable to load config")
	}
	mongoURL := config.Database.Connection
	dbName := config.Database.Database

	if mongoURL == "" {
		log.Println("MongoDB URL is missing in config")
		return false
	}
	// Connect to MongoDB
	clientOpts := options.Client().ApplyURI(mongoURL)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOpts)
	if err != nil {
		log.Println("Failed to connect to MongoDB:", err)
		return false
	}
	// Ping to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Println("MongoDB ping failed:", err)
		return false
	}
	DB = client.Database(dbName)
	return true
}
