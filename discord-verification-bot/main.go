package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	bot "github.com/ros-e/simple-verification/cmd"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}
	token := os.Getenv("TOKEN")
	if token == "" {
		fmt.Println("No token provided. Set TOKEN environment variable.")
		return
	}
	bot.Bot(token)

}
