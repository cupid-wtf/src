package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Domain struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Domain    string             `bson:"domain"`
	Donated   bool               `bson:"donated"`
	Status    string             `bson:"status"`
	AddedBy   string             `bson:"addedBy"`
	DateAdded time.Time          `bson:"dateAdded"`
}
