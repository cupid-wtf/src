package aws

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	opmcnf "github.com/opium-bio/backend-v2/utils/config"
)

type S3 struct{}

var (
	S3Client *s3.Client
)

func (s *S3) Init() bool {
	cfg, err := opmcnf.Load("config.toml")
	if err != nil {
		return false
	}

	accessKeyID := cfg.Cloudflare.S3.AccessKeyID
	secretAccessKey := cfg.Cloudflare.S3.SecretAccessKey
	accountID := cfg.Cloudflare.S3.AccountID

	awsConfig, err := config.LoadDefaultConfig(context.TODO(),
		config.WithRegion("auto"),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			accessKeyID,
			secretAccessKey,
			"",
		)),
	)
	if err != nil {
		return false
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com/", accountID)
	S3Client = s3.NewFromConfig(awsConfig, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		o.UsePathStyle = true
	})

	return true
}

var S3Instance = &S3{}
