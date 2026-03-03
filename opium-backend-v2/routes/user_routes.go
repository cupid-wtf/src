package routes

import (
	"context"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"github.com/opium-bio/backend-v2/utils/validator"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Social struct {
	Platform string `json:"platform,omitempty" bson:"platform,omitempty"`
	URL      string `json:"url,omitempty" bson:"url,omitempty"`
}

type CustomBadge struct {
	Name    string `json:"name" bson:"name" validate:"required"`
	Icon    string `json:"icon,omitempty" bson:"icon,omitempty"`
	Enabled bool   `json:"enabled" bson:"enabled"`
}

type AddSocialRequest struct {
	Platform string `json:"platform" validate:"required,safechars"`
	Name     string `json:"name" validate:"required,safechars"`
}

type RemoveSocialRequest struct {
	Platform string `json:"platform" validate:"required,safechars"`
	Name     string `json:"name" validate:"required,safechars"`
}

func containsBannedSite(url string, bannedSites []string) bool {
	for _, site := range bannedSites {
		if strings.Contains(url, site) {
			return true
		}
	}
	return false
}

type ConfigUpdateRequest struct {
	Bio             string        `json:"bio" bson:"bio" validate:"max=250"`
	Font            string        `json:"font" bson:"font" validate:"required,oneof=Sora Chillax Array Minecraft"`
	BgColor         string        `json:"bg_color" bson:"bg_color" validate:"required"`
	BoxColor        string        `json:"box_color" bson:"box_color" validate:"required"`
	AutoplayMessage string        `json:"autoplaymessage" bson:"autoplaymessage" validate:"max=100"`
	TextColor       string        `json:"text_color" bson:"text_color" validate:"required"`
	BorderColor     string        `json:"border_color" bson:"border_color" validate:"required"`
	BorderStyle     string        `json:"border_style" bson:"border_style" validate:"required"`
	AutoplayFix     bool          `json:"autoplayfix" bson:"autoplayfix"`
	BorderWidth     float64       `json:"border_width" bson:"border_width" validate:"numeric"`
	BackgroundBlur  float64       `json:"background_blur" bson:"background_blur" validate:"numeric"`
	Opacity         float64       `json:"opacity" bson:"opacity" validate:"numeric"`
	Presence        bool          `json:"presence" bson:"presence"`
	Blur            float64       `json:"blur" bson:"blur" validate:"min=0,max=100"`
	Glow            bool          `json:"glow" bson:"glow"`
	Width           float64       `json:"width" bson:"width" validate:"min=400,max=1500"`
	Socials         []Social      `json:"socials,omitempty" bson:"socials,omitempty"`
	CustomBadges    []CustomBadge `json:"custom_badges,omitempty" bson:"custom_badges,omitempty"`
}

type PremiumUpdateRequest struct {
	Layout           string `json:"layout" bson:"layout" validate:"required"`
	AvatarDecoration string `json:"avatar_decoration" bson:"avatar_decoration" validate:"required"`
}

func UserInfoHandler(c *fiber.Ctx) error {
	usersCollection := mongodb.DB.Collection("users")
	invitesCollection := mongodb.DB.Collection("invites")
	domainsCollection := mongodb.DB.Collection("domains")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}

	var user models.User
	err := usersCollection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}
	var userInvites []models.Invite
	inviteCursor, err := invitesCollection.Find(ctx, bson.M{"addedby": user.ID.Hex()})
	if err != nil {
		userInvites = []models.Invite{}
	} else {
		defer inviteCursor.Close(ctx)
		if err = inviteCursor.All(ctx, &userInvites); err != nil {
			userInvites = []models.Invite{}
		}
	}
	var usedInvites []models.Invite
	usedInviteCursor, err := invitesCollection.Find(ctx, bson.M{"addedby": user.ID.Hex()})
	if err != nil {
		usedInvites = []models.Invite{}
	} else {
		defer usedInviteCursor.Close(ctx)
		if err = usedInviteCursor.All(ctx, &usedInvites); err != nil {
			usedInvites = []models.Invite{}
		}
	}
	var usedInviteIds []primitive.ObjectID
	for _, invite := range usedInvites {
		if invite.Usedby != "" {
			if objID, err := primitive.ObjectIDFromHex(invite.Usedby); err == nil {
				usedInviteIds = append(usedInviteIds, objID)
			}
		}
	}
	var usedInviteUsers []models.User
	if len(usedInviteIds) > 0 {
		usedInviteUsersCursor, err := usersCollection.Find(ctx, bson.M{
			"_id": bson.M{"$in": usedInviteIds},
		})
		if err != nil {
			usedInviteUsers = []models.User{}
		} else {
			defer usedInviteUsersCursor.Close(ctx)
			if err = usedInviteUsersCursor.All(ctx, &usedInviteUsers); err != nil {
				usedInviteUsers = []models.User{}
			}
		}
	} else {
		usedInviteUsers = []models.User{}
	}
	var userDomains []models.Domain
	domainsCursor, err := domainsCollection.Find(ctx, bson.M{"addedBy": user.ID.Hex()})
	if err != nil {
		userDomains = []models.Domain{}
	} else {
		defer domainsCursor.Close(ctx)
		if err = domainsCursor.All(ctx, &userDomains); err != nil {
			userDomains = []models.Domain{}
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"user": fiber.Map{
			"username":         user.Username,
			"url":              user.URL,
			"email":            user.Email,
			"uid":              user.UID,
			"views":            user.Views,
			"registrationDate": user.RegistrationDate,
			"admin":            user.Admin,
			"invite_creds":     user.InviteCreds,
			"discord":          user.Discord,
			"owner":            user.Owner,
			"api_key":          user.APIKey,
			"ips":              user.IPs,
			"avatar":           user.Config.Avatar,
			"sessionid":        user.SessionID,
			"premium":          user.Premium,
			"domains":          userDomains,
			"invites":          userInvites,
			"usedinvites":      usedInviteUsers,
		},
	})
}

func HandleConfigUpdates(c *fiber.Ctx) error {
	var request ConfigUpdateRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}
	mongodb.Init()
	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	var user models.User
	err := usersCollection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}
	updateDoc := bson.M{
		"$set": bson.M{
			"config.bio":             request.Bio,
			"config.opacity":         request.Opacity,
			"config.autoplayfix":     request.AutoplayFix,
			"config.autoplaymessage": request.AutoplayMessage,
			"config.font":            request.Font,
			"config.blur":            request.Blur,
			"config.width":           request.Width,
			"config.box_color":       request.BoxColor,
			"config.border_style":    request.BorderStyle,
			"config.border_width":    request.BorderWidth,
			"config.bg_color":        request.BgColor,
			"config.text_color":      request.TextColor,
			"config.border_color":    request.BorderColor,
			"config.presence":        request.Presence,
			"config.background_blur": request.BackgroundBlur,
			"config.socials":         request.Socials,
			"config.effects.glow":    request.Glow,
			"config.custom_badges":   request.CustomBadges,
		},
	}
	result, err := usersCollection.UpdateOne(
		ctx,
		bson.M{"_id": middlewareUser.ID},
		updateDoc,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}

	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Bio updated successfully",
	})
}

func GetUserConfig(c *fiber.Ctx) error {
	mongodb.Init()
	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	var user models.User
	err := usersCollection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"user": fiber.Map{
			"config":  user.Config,
			"_id":     user.ID,
			"premium": user.Premium,
		},
	})
}

func UserPremiumSave(c *fiber.Ctx) error {
	var request PremiumUpdateRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	mongodb.Init()
	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	var user models.User
	err := usersCollection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}
	if !user.Premium {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "Premium features are not available for your account.",
		})
	}
	updateDoc := bson.M{
		"$set": bson.M{
			"config.effects.pfp_decor": request.AvatarDecoration,
			"config.user_layout":       request.Layout,
		},
	}
	result, err := usersCollection.UpdateOne(
		ctx,
		bson.M{"_id": middlewareUser.ID},
		updateDoc,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Premium settings updated successfully",
	})
}

func AddSocial(c *fiber.Ctx) error {
	var request AddSocialRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}
	if err := validator.Validate.Struct(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed: only letters, numbers, and underscores allowed for platform and name.",
			"errors":  err.Error(),
		})
	}

	mongodb.Init()
	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}

	if strings.HasPrefix(request.Name, "https://") {
		request.Name = strings.Replace(request.Name, "https://", "", 1)
	}
	if strings.HasPrefix(request.Name, "http://") {
		request.Name = strings.Replace(request.Name, "http://", "", 1)
	}
	if request.Platform == "Custom Domain" && containsBannedSite(request.Name, bannedSites) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "The provided domain is not allowed.",
		})
	}

	var user models.User
	err := usersCollection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}
	if len(user.Config.Socials) >= 10 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "You have reached the maximum number of socials.",
		})
	}
	newSocial := models.Social{
		Platform: request.Platform,
		URL:      request.Name,
	}
	updatedSocials := append(user.Config.Socials, newSocial)

	updateDoc := bson.M{
		"$set": bson.M{
			"config.socials": updatedSocials,
		},
	}

	result, err := usersCollection.UpdateOne(
		ctx,
		bson.M{"_id": middlewareUser.ID},
		updateDoc,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}

	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Added " + request.Platform + " successfully.",
	})
}
func RemoveSocial(c *fiber.Ctx) error {
	var request RemoveSocialRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}
	if err := validator.Validate.Struct(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed: only letters, numbers, and underscores allowed for platform and name.",
			"errors":  err.Error(),
		})
	}

	mongodb.Init()
	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	userVal := c.Locals("user")
	middlewareUser, ok := userVal.(models.User)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"message": "Unauthorized.",
		})
	}
	var user models.User
	err := usersCollection.FindOne(ctx, bson.M{"_id": middlewareUser.ID}).Decode(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to fetch user data",
		})
	}
	var updatedSocials []models.Social
	for _, social := range user.Config.Socials {
		if !(social.Platform == request.Platform && social.URL == request.Name) {
			updatedSocials = append(updatedSocials, social)
		}
	}
	updateDoc := bson.M{
		"$set": bson.M{
			"config.socials": updatedSocials,
		},
	}
	if len(updatedSocials) == 0 {
		updateDoc = bson.M{
			"$unset": bson.M{
				"config.socials": "",
			},
		}
	}
	result, err := usersCollection.UpdateOne(
		ctx,
		bson.M{"_id": middlewareUser.ID},
		updateDoc,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}

	if result.MatchedCount == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "User not found",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Removed " + request.Platform + " successfully.",
	})
}
