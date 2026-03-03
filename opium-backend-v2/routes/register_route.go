package routes

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"slices"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/opium-bio/backend-v2/models"
	"github.com/opium-bio/backend-v2/utils/cloudflare"
	"github.com/opium-bio/backend-v2/utils/mailgun"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"github.com/opium-bio/backend-v2/utils/validator"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type RegisterRequest struct {
	Username   string `json:"username" validate:"required,min=3,max=16,safechars"`
	URL        string `json:"url" validate:"required,min=3,max=16,safechars"`
	Email      string `json:"email" validate:"required,email"`
	Password   string `json:"password" validate:"required,min=8,max=150"`
	Invite     string `json:"invite" validate:"required"`
	Cloudflare string `json:"cloudflare" validate:"required"`
}

var reservedWords = []string{
	"api", "login", "register", "auth", "legal", "admin", "dash", "docs", "support", "discord", "shop", "reset-password", "forgot-password",
}

func hashIP(ip string) string {
	hash := sha256.Sum256([]byte(ip))
	return hex.EncodeToString(hash[:])
}

func generateRandomHex(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func RegisterRoute(c *fiber.Ctx) error {
	mongodb.Init()
	usersCollection := mongodb.DB.Collection("users")
	invitesCollection := mongodb.DB.Collection("invites")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid request body",
		})
	}

	req.Username = strings.TrimSpace(req.Username)
	req.URL = strings.TrimSpace(req.URL)
	req.Email = strings.TrimSpace(req.Email)
	req.Password = strings.TrimSpace(req.Password)
	req.Invite = strings.TrimSpace(req.Invite)
	req.Cloudflare = strings.TrimSpace(req.Cloudflare)

	if err := validator.Validate.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Validation failed: only letters, numbers, and underscores allowed for username and url.",
			"errors":  err.Error(),
		})
	}

	isValid, err := cloudflare.VerifyTurnstileToken(req.Cloudflare)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to verify captcha",
		})
	}
	if !isValid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid captcha verification",
		})
	}

	if slices.Contains(reservedWords, strings.ToLower(req.URL)) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": fmt.Sprintf(`The URL "%s" is not allowed.`, req.URL),
		})
	}

	var existingUser models.User
	err = usersCollection.FindOne(ctx, bson.M{"username": req.Username}).Decode(&existingUser)
	if err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Username is already in use",
		})
	} else if err != mongo.ErrNoDocuments {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Internal Server Error",
		})
	}

	err = usersCollection.FindOne(ctx, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Email is already registered",
		})
	} else if err != mongo.ErrNoDocuments {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Internal Server Error",
		})
	}
	err = usersCollection.FindOne(ctx, bson.M{"url": req.URL}).Decode(&existingUser)
	if err == nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "URL is already in use",
		})
	} else if err != mongo.ErrNoDocuments {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Internal Server Error",
		})
	}

	var invite models.Invite
	err = invitesCollection.FindOne(ctx, bson.M{"key": req.Invite}).Decode(&invite)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid invite code",
		})
	}
	if invite.Status == "used" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invite code already used",
		})
	}

	pipeline := []bson.M{
		{"$sort": bson.M{"uid": -1}},
		{"$limit": 1},
		{"$project": bson.M{"uid": 1}},
	}
	cursor, err := usersCollection.Aggregate(ctx, pipeline)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate UID",
		})
	}
	defer cursor.Close(ctx)

	var lastUser []bson.M
	if err := cursor.All(ctx, &lastUser); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate UID",
		})
	}

	nextUID := 0
	if len(lastUser) > 0 {
		if uid, ok := lastUser[0]["uid"].(int32); ok {
			nextUID = int(uid) + 1
		}
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), 12)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to hash password",
		})
	}

	emailVerificationToken, err := generateRandomHex(32)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate verification token",
		})
	}

	extraHash, err := generateRandomHex(25)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to generate API key",
		})
	}

	newUser := models.DefaultUser
	newUser.ID = primitive.NewObjectID()
	newUser.Username = strings.ToLower(req.Username)
	newUser.URL = strings.ToLower(req.URL)
	newUser.Email = req.Email
	newUser.Password = string(hashedPassword)
	newUser.EmailVerificationToken = &emailVerificationToken
	newUser.UID = nextUID
	newUser.APIKey = fmt.Sprintf("%s_%s", strings.ToLower(req.Username), extraHash)
	newUser.RegistrationDate = time.Now()
	clientIP := c.IP()
	newUser.IPs = []string{hashIP(clientIP)}

	_, err = usersCollection.InsertOne(ctx, &newUser)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to create user",
		})
	}

	now := primitive.NewDateTimeFromTime(time.Now())
	_, err = invitesCollection.UpdateOne(
		ctx,
		bson.M{"key": req.Invite},
		bson.M{
			"$set": bson.M{
				"usedon": now,
				"status": "used",
				"usedby": newUser.ID.Hex(),
			},
		},
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update invite status",
		})
	}
	verifyURL := fmt.Sprintf("https://cupid.wtf/verify/%s", emailVerificationToken)
	username := strings.ToLower(newUser.Username)
	htmlBody := fmt.Sprintf(`<!DOCTYPE html>
		<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f0f0f;">
		<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
			<tr>
			<td align="center" style="padding: 20px 0;">
				<table role="presentation" style="max-width: 600px; width: 100%%; border-collapse: collapse; background-color: #000000; border: 1px solid #3a3a3c; border-radius: 12px; overflow: hidden;">
				<!-- Header with Logo -->
				<tr>
					<td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid #222222;">
					<!-- Moon Logo SVG with text-purple-700 color (#7c3aed) -->
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
						fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;">
						<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
					</svg>

					<h2 style="margin: 15px 0 5px; color: #ffffff; font-size: 24px; font-weight: 700;">
						cupid.wtf	
					</h2>

					<div style="margin-top: 15px;">
						<span style="display: inline-block; height: 2px; width: 40px; background: linear-gradient(90deg,rgb(104, 30, 231), #7c3aed); margin: 0 auto;"></span>
					</div>
					</td>
				</tr>
				<tr>
					<td style="padding: 40px; text-align: left;">
					<h1 style="margin: 0 0 25px; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
						enhance your digital presence
					</h1>

					<p style="margin: 0 0 25px; color: #ededed; font-size: 16px; line-height: 1.6;">
						Welcome to <span style="color: #7c3aed; font-weight: 600;">cupid.wtf</span>, %s!
					</p>
					<p style="margin: 0 0 25px; color: #ededed; font-size: 16px; line-height: 1.6;">
						Thank you for registering with us. Please verify your email address to complete your registration and start enhancing your digital presence.
					</p>
					<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin: 35px 0;">
						<tr>
						<td align="center">
							<a href="%s" style="display: inline-block; background: linear-gradient(90deg, #9333ea, #7c3aed); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; transition: all 0.3s ease;">
							Verify Your Email
							</a>
						</td>
						</tr>
					</table>
					<p style="margin: 30px 0 10px; color: #a3a3a3; font-size: 14px; line-height: 1.5;">
						Media Hosting, Bio, E-Mail, all in one place - your complete digital solution.
					</p>

					<p style="margin: 25px 0 0; color: #71717a; font-size: 14px; line-height: 1.5; font-style: italic;">
						If you didn't sign up for this account, you can safely ignore this email.
					</p>
					</td>
				</tr>
				<tr>
					<td style="background-color: #0a0a0a; padding: 30px 40px; border-top: 1px solid #222222;">
					<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0">
						<tr>
						<td style="text-align: center;">
							<p style="margin: 0 0 15px; color: #a3a3a3; font-size: 14px;">
							Connect with us
							</p>
							<div>
							<a href="#" style="display: inline-block; margin: 0 10px; color: #7c3aed; text-decoration: none; font-size: 14px;">Discord</a>
							</div>
						</td>
						</tr>
						<tr>
						<td style="padding-top: 20px; text-align: center;">
							<p style="margin: 0; color: #71717a; font-size: 13px;">
							&copy; 2025 cupid.wtf. All rights reserved.
							</p>
						</td>
						</tr>
					</table>
					</td>
				</tr>
				</table>
			</td>
			</tr>
		</table>
		</body>`, username, verifyURL)

	err = mailgun.SendEmail(
		"Please Verify Your Email Address",
		newUser.Email,
		"no-reply@cupid.wtf",
		htmlBody,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to send verification email",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "User registered successfully. Please check your email for verification.",
	})
}
