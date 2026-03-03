package config

import (
	"os"

	"github.com/BurntSushi/toml"
)

type Config struct {
	Server struct {
		Port    int    `toml:"port"`
		Profile string `toml:"profile"`
	} `toml:"server"`

	Database struct {
		Connection string `toml:"connection"`
		Database   string `toml:"database"`
	} `toml:"database"`

	Lumi struct {
		AccessKey string `toml:"accesskey"`
	} `toml:"lumi"`
	Discord struct {
		ClientId     string `toml:"client_id"`
		ClientSecret string `toml:"client_secret"`
	}
	Cloudflare struct {
		S3 struct {
			AccessKeyID     string `toml:"access_key_id"`
			SecretAccessKey string `toml:"secret_access_key"`
			AccountID       string `toml:"account_id"`
			BucketName      string `toml:"bucket_name"`
		} `toml:"s3"`

		Turnstile struct {
			PublicSiteKey string `toml:"public_site_key"`
			SecretKey     string `toml:"secret_key"`
		} `toml:"turnstile"`
	} `toml:"cloudflare"`

	Mailgun struct {
		APIKey string `toml:"api_key"`
		Domain string `toml:"domain"`
	} `toml:"mailgun"`

	JWT struct {
		SigningKey string `toml:"signing_key"`
	} `toml:"jwt"`

	SMTP struct {
	} `toml:"smtp"`
}

func (c Config) GetString(s string, param2 string) any {
	panic("unimplemented")
}

func Load(defaultPath string) (config Config, err error) {
	path := os.Getenv("CONFIG")
	if path == "" {
		path = defaultPath
	}
	_, err = toml.DecodeFile(path, &config)
	return
}
