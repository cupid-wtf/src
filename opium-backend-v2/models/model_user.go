package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Blacklisted struct {
	Status bool   `json:"status" bson:"status"`
	Reason string `json:"reason" bson:"reason"`
}

type Social struct {
	Platform string `json:"platform" bson:"platform"`
	URL      string `json:"url" bson:"url"`
}

type Effects struct {
	Decoration      string `json:"decoration" bson:"decoration"`
	Glow            bool   `json:"glow" bson:"glow"`
	Tilt            bool   `json:"tilt" bson:"tilt"`
	PfpDecor        string `json:"pfp_decor" bson:"pfp_decor"`
	BackgroundDecor string `json:"background_decor" bson:"background_decor"`
}

type Audio struct {
	URL   *string `json:"url" bson:"url"`
	Name  *string `json:"name" bson:"name"`
	Cover *string `json:"cover" bson:"cover"`
}

type Background struct {
	URL  *string `json:"url" bson:"url"`
	Type *string `json:"type" bson:"type"`
}

type UserBadge struct {
	ID      primitive.ObjectID `json:"_id" bson:"_id,omitempty"`
	Name    string             `json:"name" bson:"name"`
	Enabled bool               `json:"enabled" bson:"enabled"`
}

type CustomBadge struct {
	ID      primitive.ObjectID `json:"_id" bson:"_id,omitempty"`
	Name    string             `json:"name" bson:"name"`
	Icon    string             `json:"icon" bson:"icon"`
	Enabled bool               `json:"enabled" bson:"enabled"`
}

type Config struct {
	BoxColor        string        `json:"box_color" bson:"box_color"`
	Width           int           `json:"width" bson:"width"`
	BgColor         string        `json:"bg_color" bson:"bg_color"`
	BackgroundBlur  int           `json:"background_blur" bson:"background_blur"`
	BorderColor     string        `json:"border_color" bson:"border_color"`
	BorderWidth     int           `json:"border_width" bson:"border_width"`
	BorderStyle     string        `json:"border_style" bson:"border_style"`
	TextColor       string        `json:"text_color" bson:"text_color"`
	Avatar          *string       `json:"avatar" bson:"avatar"`
	Socials         []Social      `json:"socials" bson:"socials"`
	Banner          *string       `json:"banner" bson:"banner"`
	Bio             string        `json:"bio" bson:"bio"`
	Font            *string       `json:"font" bson:"font"`
	Effects         Effects       `json:"effects" bson:"effects"`
	Background      *Background   `json:"background" bson:"background"`
	Opacity         float64       `json:"opacity" bson:"opacity"`
	Blur            int           `json:"blur" bson:"blur"`
	Presence        bool          `json:"presence" bson:"presence"`
	UserLayout      string        `json:"user_layout" bson:"user_layout"`
	AutoplayFix     bool          `json:"autoplayfix" bson:"autoplayfix"`
	Audio           *Audio        `json:"audio" bson:"audio"`
	AutoplayMessage string        `json:"autoplaymessage" bson:"autoplaymessage"`
	UserBadges      []UserBadge   `json:"user_badges" bson:"user_badges"`
	CustomBadges    []CustomBadge `json:"custom_badges" bson:"custom_badges"`
}

type Discord struct {
	ID             *string    `json:"id" bson:"id"`
	Invite         *string    `json:"invite" bson:"invite"`
	URL            *string    `json:"url" bson:"url"`
	ConnectionDate *time.Time `json:"connection_date" bson:"connection_date"`
	Enabled        bool       `json:"enabled" bson:"enabled"`
}

type Views struct {
	Date  time.Time `json:"date" bson:"date"`
	Views string    `json:"views" bson:"views"`
}

type Host struct {
	Key    string `json:"key" bson:"key"`
	Domain string `json:"domain" bson:"domain"`
}

type User struct {
	ID                     primitive.ObjectID `json:"_id" bson:"_id,omitempty"`
	Username               string             `json:"username" bson:"username"`
	URL                    string             `json:"url" bson:"url"`
	UID                    int                `json:"uid" bson:"uid"`
	Admin                  bool               `json:"admin" bson:"admin"`
	APIKey                 string             `json:"api_key" bson:"api_key"`
	Email                  string             `json:"email" bson:"email"`
	Premium                bool               `json:"premium" bson:"premium"`
	Blacklisted            Blacklisted        `json:"blacklisted" bson:"blacklisted"`
	InviteCreds            int                `json:"invite_creds" bson:"invite_creds"`
	Config                 Config             `json:"config" bson:"config"`
	Discord                Discord            `json:"discord" bson:"discord"`
	Views                  []Views            `json:"views" bson:"views"`
	Password               string             `json:"password" bson:"password"`
	Verified               bool               `json:"verified" bson:"verified"`
	EmailVerified          bool               `json:"emailVerified" bson:"emailVerified"`
	EmailVerificationToken *string            `json:"emailVerificationtoken" bson:"emailVerificationtoken"`
	PasswordResetToken     *string            `json:"passwordResetToken" bson:"passwordResetToken"`
	RawStorage             *string            `json:"raw_storage" bson:"raw_storage"`
	SessionID              *string            `json:"sessionid" bson:"sessionid"`
	LastAutoWipeDate       *time.Time         `json:"lastautowipe_date" bson:"lastautowipe_date"`
	RegistrationDate       time.Time          `json:"registrationDate" bson:"registrationDate"`
	LastLoginDate          *time.Time         `json:"lastLoginDate" bson:"lastLoginDate"`
	Host                   Host               `json:"host" bson:"host"`
	IPs                    []string           `json:"ips" bson:"ips"`
	Owner                  bool               `json:"owner" bson:"owner"`
	ResetToken             *string            `json:"reset_token" bson:"reset_token"`
	ResetExpires           *time.Time         `json:"reset_expires" bson:"reset_expires"`
}

func stringPtr(s string) *string {
	return &s
}

var DefaultUser = User{
	Premium:       false,
	Admin:         false,
	Owner:         false,
	Verified:      false,
	EmailVerified: false,
	InviteCreds:   0,
	Blacklisted: Blacklisted{
		Status: false,
		Reason: "",
	},
	Config: Config{
		BoxColor:       "#000000",
		Width:          600,
		BgColor:        "#000000",
		BackgroundBlur: 0,
		BorderColor:    "#000000",
		BorderWidth:    0,
		BorderStyle:    "solid",
		TextColor:      "#ffffff",
		Avatar:         nil,
		Socials:        []Social{},
		Banner:         nil,
		Bio:            "",
		Font:           stringPtr("Sora"),
		Effects: Effects{
			Decoration:      "",
			Glow:            false,
			Tilt:            false,
			PfpDecor:        "",
			BackgroundDecor: "",
		},
		Background: &Background{
			URL:  nil,
			Type: nil,
		},
		Opacity:     0.25,
		Blur:        0,
		Presence:    false,
		UserLayout:  "Default",
		AutoplayFix: false,
		Audio: &Audio{
			URL:   nil,
			Name:  nil,
			Cover: nil,
		},
		AutoplayMessage: "",
		UserBadges:      []UserBadge{},
		CustomBadges:    []CustomBadge{},
	},
	Discord: Discord{
		ID:             nil,
		Invite:         nil,
		URL:            nil,
		ConnectionDate: nil,
		Enabled:        false,
	},
	Views:        []Views{},
	IPs:          []string{},
	ResetToken:   nil,
	ResetExpires: nil,
}
