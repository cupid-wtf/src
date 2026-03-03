package cloudflare

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/opium-bio/backend-v2/utils/config"
)

func Create_Domain(domain string) error {
	return nil
}

func Delete_Domain(domain string) error {
	return nil
}

type TurnstileResponse struct {
	Success bool `json:"success"`
}

func VerifyTurnstileToken(token string) (bool, error) {
	cfg, err := config.Load("config.toml")
	if err != nil {
		return false, fmt.Errorf("failed to load config: %w", err)
	}
	secret := cfg.Cloudflare.Turnstile.SecretKey
	if secret == "" {
		return false, fmt.Errorf("missing Turnstile secret in config")
	}
	payload := map[string]string{
		"secret":   secret,
		"response": token,
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return false, fmt.Errorf("failed to encode JSON: %w", err)
	}
	resp, err := http.Post(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		"application/json",
		bytes.NewBuffer(body),
	)
	if err != nil {
		return false, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()
	var result TurnstileResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("failed to decode response: %w", err)
	}
	return result.Success, nil
}
