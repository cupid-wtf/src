package routes

import (
	"context"
	"fmt"
	"log"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/opium-bio/backend-v2/models"
	awsUtils "github.com/opium-bio/backend-v2/utils/aws"
	"github.com/opium-bio/backend-v2/utils/mongodb"
	"go.mongodb.org/mongo-driver/bson"
)

const maxImageSize = 80 << 20
const maxVideoSize = 100 << 20
const maxAudioSize = 50 << 20

var imageTypes = []string{
	"image/jpeg",
	"image/jpg",
	"image/png",
	"image/gif",
	"image/webp",
}

var videoTypes = []string{
	"video/mp4",
	"video/webm",
}

var audioTypes = []string{
	"audio/mp3",
	"audio/ogg",
	"audio/mpeg",
}

func isValidImageType(mimeType string) bool {
	return slices.Contains(imageTypes, mimeType)
}

func isValidVideoType(mimeType string) bool {
	return slices.Contains(videoTypes, mimeType)
}

func isValidAudioType(mimeType string) bool {
	return slices.Contains(audioTypes, mimeType)
}

func AvatarUploadHandler(c *fiber.Ctx) error {
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
			"message": "Failed to find user",
		})
	}
	if user.Config.Avatar != nil && *user.Config.Avatar != "" {
		oldKey := strings.TrimPrefix(*user.Config.Avatar, "https://r2.opium.bio/")
		_, err := awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(oldKey),
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Error deleting old avatar",
			})
		}
	}
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "No file provided",
		})
	}
	if file.Size > maxImageSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "File too large (max 80MB)",
		})
	}
	mimeType := file.Header.Get("Content-Type")
	if !isValidImageType(mimeType) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid file type. Only image files are allowed.",
		})
	}
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to open file",
		})
	}
	defer src.Close()
	fileID := uuid.New().String()
	ext := filepath.Ext(file.Filename)
	key := fmt.Sprintf("avatars/%s%s", fileID, ext)
	uploadCtx, uploadCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer uploadCancel()
	_, err = awsUtils.S3Client.PutObject(uploadCtx, &s3.PutObjectInput{
		Bucket:      aws.String("opium"),
		Key:         aws.String(key),
		Body:        src,
		ContentType: aws.String(mimeType),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	avatarURL := fmt.Sprintf("https://r2.opium.bio/%s", key)
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{"config.avatar": avatarURL},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Avatar uploaded successfully",
		"url":     avatarURL,
	})
}
func DeleteAvatarHandler(c *fiber.Ctx) error {
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
			"message": "An internal server error has occurred",
		})
	}
	if user.Config.Avatar == nil || *user.Config.Avatar == "" {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "No avatar found to delete",
		})
	}
	avatarURL := *user.Config.Avatar
	filename := filepath.Base(avatarURL)
	fileKey := fmt.Sprintf("avatars/%s", filename)
	_, err = awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String("opium"),
		Key:    aws.String(fileKey),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{"config.avatar": nil},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Avatar deleted successfully",
	})
}
func BannerUploadHandler(c *fiber.Ctx) error {
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
			"message": "Failed to find user",
		})
	}
	if user.Config.Banner != nil && *user.Config.Banner != "" {
		oldKey := strings.TrimPrefix(*user.Config.Banner, "https://r2.opium.bio/")
		_, err := awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(oldKey),
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Error deleting old banner",
			})
		}
	}
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "No file provided",
		})
	}
	if file.Size > maxImageSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "File too large (max 80MB)",
		})
	}
	mimeType := file.Header.Get("Content-Type")
	if !isValidImageType(mimeType) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid file type. Only image files are allowed.",
		})
	}
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to open file",
		})
	}
	defer src.Close()
	fileID := uuid.New().String()
	ext := filepath.Ext(file.Filename)
	key := fmt.Sprintf("banners/%s%s", fileID, ext)
	uploadCtx, uploadCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer uploadCancel()
	_, err = awsUtils.S3Client.PutObject(uploadCtx, &s3.PutObjectInput{
		Bucket:      aws.String("opium"),
		Key:         aws.String(key),
		Body:        src,
		ContentType: aws.String(mimeType),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	bannerURL := fmt.Sprintf("https://r2.opium.bio/%s", key)
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{"config.banner": bannerURL},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Banner uploaded successfully",
		"url":     bannerURL,
	})
}
func DeleteBannerHandler(c *fiber.Ctx) error {
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
			"message": "An internal server error has occurred",
		})
	}
	if user.Config.Banner == nil || *user.Config.Banner == "" {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "No banner found to delete",
		})
	}
	bannerURL := *user.Config.Banner
	filename := filepath.Base(bannerURL)
	fileKey := fmt.Sprintf("banners/%s", filename)
	_, err = awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String("opium"),
		Key:    aws.String(fileKey),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{"config.banner": nil},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Banner deleted successfully",
	})
}
func BackgroundUploadHandler(c *fiber.Ctx) error {
	usersCollection := mongodb.DB.Collection("users")
	ctx, cancel := context.WithTimeout(context.Background(), 300*time.Second)
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
			"message": "Failed to find user",
		})
	}
	if user.Config.Background != nil && user.Config.Background.URL != nil && *user.Config.Background.URL != "" {
		oldKey := strings.TrimPrefix(*user.Config.Background.URL, "https://r2.opium.bio/")
		_, err := awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(oldKey),
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Error deleting old background",
			})
		}
	}
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "No file provided",
		})
	}
	if file.Size > maxVideoSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "File too large (max 100MB)",
		})
	}
	mimeType := file.Header.Get("Content-Type")
	if !isValidImageType(mimeType) && !isValidVideoType(mimeType) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid file type. Only image or video files are allowed.",
		})
	}
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to open file",
		})
	}
	defer src.Close()
	fileID := uuid.New().String()
	ext := filepath.Ext(file.Filename)
	key := fmt.Sprintf("backgrounds/%s%s", fileID, ext)
	uploadCtx, uploadCancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer uploadCancel()
	_, err = awsUtils.S3Client.PutObject(uploadCtx, &s3.PutObjectInput{
		Bucket:      aws.String("opium"),
		Key:         aws.String(key),
		Body:        src,
		ContentType: aws.String(mimeType),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	backgroundURL := fmt.Sprintf("https://r2.opium.bio/%s", key)
	fileCategory := "image"
	if isValidVideoType(mimeType) {
		fileCategory = "video"
	}
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{
			"config.background.url":  backgroundURL,
			"config.background.type": fileCategory,
		},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Background uploaded successfully",
		"url":     backgroundURL,
	})
}
func DeleteBackgroundHandler(c *fiber.Ctx) error {
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
			"message": "An internal server error has occurred",
		})
	}
	if user.Config.Background == nil || user.Config.Background.URL == nil || *user.Config.Background.URL == "" {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "No background found to delete",
		})
	}
	backgroundURL := *user.Config.Background.URL
	filename := filepath.Base(backgroundURL)
	fileKey := fmt.Sprintf("backgrounds/%s", filename)
	_, err = awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String("opium"),
		Key:    aws.String(fileKey),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{
			"config.background.url":  "",
			"config.background.type": "",
		},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "An internal server error has occurred",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Background deleted successfully",
	})
}

func UploadSongHandler(c *fiber.Ctx) error {
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
			"message": "Failed to find user",
		})
	}
	audioFile, err := c.FormFile("audioFile")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Audio file is required",
		})
	}
	coverFile, err := c.FormFile("coverFile")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Cover file is required",
		})
	}
	songName := c.FormValue("songName")
	if audioFile.Size > maxAudioSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Audio file too large (max 50MB)",
		})
	}
	if coverFile.Size > maxImageSize {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Cover file too large (max 80MB)",
		})
	}
	audioMimeType := audioFile.Header.Get("Content-Type")
	if !isValidAudioType(audioMimeType) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid audio file type. Only MP3 files are allowed.",
		})
	}
	coverMimeType := coverFile.Header.Get("Content-Type")
	if !isValidImageType(coverMimeType) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"message": "Invalid cover file type. Only JPEG and PNG files are allowed.",
		})
	}
	if user.Config.Audio != nil {
		if user.Config.Audio.URL != nil && *user.Config.Audio.URL != "" {
			filename := filepath.Base(*user.Config.Audio.URL)
			oldAudioKey := fmt.Sprintf("music/%s", filename)
			_, err := awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String("opium"),
				Key:    aws.String(oldAudioKey),
			})
			if err != nil {
				log.Printf("Warning: Failed to delete old audio file: %v", err)
			}
		}
		if user.Config.Audio.Cover != nil && *user.Config.Audio.Cover != "" {
			filename := filepath.Base(*user.Config.Audio.Cover)
			oldCoverKey := fmt.Sprintf("covers/%s", filename)
			_, err := awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
				Bucket: aws.String("opium"),
				Key:    aws.String(oldCoverKey),
			})
			if err != nil {
				log.Printf("Warning: Failed to delete old cover file: %v", err)
			}
		}
	}
	audioSrc, err := audioFile.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to open audio file",
		})
	}
	defer audioSrc.Close()
	coverSrc, err := coverFile.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to open cover file",
		})
	}
	defer coverSrc.Close()
	audioID := uuid.New().String()
	coverID := uuid.New().String()
	audioExt := filepath.Ext(audioFile.Filename)
	coverExt := filepath.Ext(coverFile.Filename)
	audioKey := fmt.Sprintf("music/%s%s", audioID, audioExt)
	coverKey := fmt.Sprintf("covers/%s%s", coverID, coverExt)
	uploadCtx, uploadCancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer uploadCancel()
	_, err = awsUtils.S3Client.PutObject(uploadCtx, &s3.PutObjectInput{
		Bucket:      aws.String("opium"),
		Key:         aws.String(audioKey),
		Body:        audioSrc,
		ContentType: aws.String(audioMimeType),
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to upload audio file",
		})
	}
	_, err = awsUtils.S3Client.PutObject(uploadCtx, &s3.PutObjectInput{
		Bucket:      aws.String("opium"),
		Key:         aws.String(coverKey),
		Body:        coverSrc,
		ContentType: aws.String(coverMimeType),
	})
	if err != nil {
		awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(audioKey),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to upload cover file",
		})
	}
	audioURL := fmt.Sprintf("https://r2.opium.bio/%s", audioKey)
	coverURL := fmt.Sprintf("https://r2.opium.bio/%s", coverKey)
	finalSongName := songName
	if finalSongName == "" {
		finalSongName = strings.TrimSuffix(audioFile.Filename, audioExt)
	}
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{
			"config.audio.url":   audioURL,
			"config.audio.cover": coverURL,
			"config.audio.name":  finalSongName,
		},
	})
	if err != nil {
		log.Printf("Failed to upload audio file: %v", err)
		awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(audioKey),
		})
		awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(coverKey),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update user profile",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Music uploaded successfully",
		"audio":   audioURL,
		"cover":   coverURL,
		"name":    finalSongName,
	})
}

func DeleteMusicHandler(c *fiber.Ctx) error {
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
			"message": "Failed to find user",
		})
	}
	if user.Config.Audio == nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"success": false,
			"message": "No music found to delete",
		})
	}
	if user.Config.Audio.URL != nil && *user.Config.Audio.URL != "" {
		filename := filepath.Base(*user.Config.Audio.URL)
		audioKey := fmt.Sprintf("music/%s", filename)
		_, err = awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(audioKey),
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Failed to delete audio file",
			})
		}
	}
	if user.Config.Audio.Cover != nil && *user.Config.Audio.Cover != "" {
		filename := filepath.Base(*user.Config.Audio.Cover)
		coverKey := fmt.Sprintf("covers/%s", filename)
		_, err = awsUtils.S3Client.DeleteObject(ctx, &s3.DeleteObjectInput{
			Bucket: aws.String("opium"),
			Key:    aws.String(coverKey),
		})
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"message": "Failed to delete cover file",
			})
		}
	}
	_, err = usersCollection.UpdateOne(ctx, bson.M{"_id": middlewareUser.ID}, bson.M{
		"$set": bson.M{
			"config.audio.url":   nil,
			"config.audio.cover": nil,
			"config.audio.name":  nil,
		},
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"message": "Failed to update user profile",
		})
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Music deleted successfully",
	})
}
