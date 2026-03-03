package mailgun

import (
	"context"
	"fmt"
	"time"

	"github.com/mailgun/mailgun-go/v5"
	"github.com/opium-bio/backend-v2/utils/config"
)

func SendEmail(subject, recipient, sender, htmlBody string) error {
	cfg, err := config.Load("config.toml")
	if err != nil {
		return fmt.Errorf("failed to load config: %w", err)
	}
	apiKey := cfg.Mailgun.APIKey
	domain := cfg.Mailgun.Domain
	mg := mailgun.NewMailgun(apiKey)
	message := mailgun.NewMessage(domain, sender, subject, "", recipient)
	message.SetHTML(htmlBody)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	resp, err := mg.Send(ctx, message)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	fmt.Printf("Mailgun response: ID=%s, Message=%s\n", resp.ID, resp.Message)
	return nil
}
