package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/opium-bio/backend-v2/middleware"
	"github.com/opium-bio/backend-v2/routes"
	"github.com/opium-bio/backend-v2/utils/aws"
	"github.com/opium-bio/backend-v2/utils/config"
	"github.com/opium-bio/backend-v2/utils/mongodb"
)

func main() {
	config, err := config.Load("config.toml")
	if err != nil {
		log.Fatalln("Unable to load config")
	}
	log.Printf("Config loaded successfully")
	if !mongodb.Init() {
		log.Fatalln("Failed to connect to MongoDB")
	}
	log.Printf("Connected to MongoDB successfully")
	if !aws.S3Instance.Init() {
		log.Fatal("Failed to initialize S3 client")
	}
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
		ReadTimeout:           10 * time.Second,
		WriteTimeout:          10 * time.Second,
		BodyLimit:             100 * 1024 * 1024,
		ServerHeader:          "",
	})
	app.Use(helmet.New(helmet.Config{
		XSSProtection:             "1; mode=block",
		ContentTypeNosniff:        "nosniff",
		XFrameOptions:             "DENY",
		ReferrerPolicy:            "no-referrer",
		CrossOriginEmbedderPolicy: "require-corp",
		HSTSMaxAge:                31536000,
		HSTSPreloadEnabled:        true,
	}))
	publicCORS := cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	})
	restrictedCORS := cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000, https://cupid.wtf",
		AllowCredentials: true,
	})
	app.Get("/", publicCORS, func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"success": true,
			"message": "cupid backend",
		})
	})
	app.Get("/v1/domains", publicCORS, routes.ListDomainsHandler)
	app.Get("/v2/leaderboard", publicCORS, routes.LeaderboardHandler)
	app.Get("/v2/profile/:url", publicCORS, middleware.APIKeyAuth(), routes.GetProfileHandler)
	app.Post("/views", restrictedCORS, routes.ProfileView)
	app.Post("/verify", restrictedCORS, routes.VerifyEmailHandler)
	api_auth := app.Group("/v1/auth", restrictedCORS)
	api_auth.Post("/login", routes.LoginRoute)
	api_auth.Post("/register", routes.RegisterRoute)
	app.Post("/v2/forgot", restrictedCORS, routes.ForgotPassword)
	app.Get("/v2/validate-reset", restrictedCORS, routes.ValidateResetCode)
	app.Post("/v2/reset", restrictedCORS, routes.ResetPassword)
	v1 := app.Group("/v1", restrictedCORS, middleware.AuthMiddleware)
	v1.Get("/auth/signout", routes.SignOutRoute)
	v1.Get("/@me", routes.UserInfoHandler)
	v1.Post("/bio", routes.HandleConfigUpdates)
	v1.Get("/bio", routes.GetUserConfig)
	v1.Post("/create/domains", routes.AddDomainHamdler)
	v1.Post("/avatar", routes.AvatarUploadHandler)
	v1.Post("/banner", routes.BannerUploadHandler)
	v1.Post("/background", routes.BackgroundUploadHandler)
	v1.Post("/music/upload", routes.UploadSongHandler)
	v1.Post("/premium/config", routes.UserPremiumSave)
	v1.Delete("/avatar", routes.DeleteAvatarHandler)
	v1.Delete("/banner", routes.DeleteBannerHandler)
	v1.Delete("/background", routes.DeleteBackgroundHandler)
	v1.Delete("/music/delete", routes.DeleteMusicHandler)
	v1.Post("/@me", routes.InfoUpdater)
	v1.Post("/password", routes.ChangePasswordHandler)
	v1.Put("/refresh", routes.RefreshAPIKey)
	v1.Post("/socials/add", routes.AddSocial)
	v1.Delete("/socials/remove", routes.RemoveSocial)
	v2 := app.Group("/v2", restrictedCORS, middleware.AuthMiddleware)
	v2.Get("/discord/auth", routes.InitDiscordOAuth)
	v2.Delete("/discord/reset", routes.ResetDiscord)
	v2.Get("/discord/callback", routes.ConnectDiscord)
	log.Fatal(app.Listen(fmt.Sprintf(":%d", config.Server.Port)))
}
