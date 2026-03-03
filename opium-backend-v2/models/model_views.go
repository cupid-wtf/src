package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type View struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id,omitempty"`
	UserID    primitive.ObjectID `bson:"user_id" json:"user_id"`
	IP        string             `bson:"ip" json:"ip"`
	UserAgent string             `bson:"user_agent,omitempty" json:"user_agent,omitempty"`
	ViewedAt  time.Time          `bson:"viewed_at" json:"viewed_at"`
}
