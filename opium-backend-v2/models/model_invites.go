package models

import "go.mongodb.org/mongo-driver/bson/primitive"

type Invite struct {
	ID        primitive.ObjectID  `json:"_id" bson:"_id,omitempty"`
	Key       string              `json:"key" bson:"key,omitempty"`
	AddedBy   string              `json:"addedby" bson:"addedby,omitempty"`
	Usedby    string              `json:"usedby" bson:"usedby,omitempty"`
	CreatedOn primitive.DateTime  `json:"createdon" bson:"createdon,omitempty"`
	Usedon    *primitive.DateTime `json:"usedon" bson:"usedon,omitempty"`
	Status    string              `json:"status" bson:"status,omitempty"` // unused or used
}
