package bot

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/bwmarrin/discordgo"
)

func Bot(token string) {
	discord, err := discordgo.New("Bot " + token)
	if err != nil {
		fmt.Println("Error creating Discord session:", err)
		return
	}
	if err = discord.Open(); err != nil {
		fmt.Println("Error opening Discord session:", err)
		return
	}
	defer discord.Close()
	fmt.Println("Bot is now running.")
	discord.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		if i.Type == discordgo.InteractionMessageComponent {
			if i.MessageComponentData().CustomID == "verify_button" {
				verificationRoleID := "1338012118288699434"
				member, err := s.GuildMember(i.GuildID, i.Member.User.ID)
				if err != nil {
					fmt.Println("Error getting member:", err)
					return
				}
				hasRole := false
				for _, roleID := range member.Roles {
					if roleID == verificationRoleID {
						hasRole = true
						break
					}
				}
				if hasRole {
					s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
						Type: discordgo.InteractionResponseChannelMessageWithSource,
						Data: &discordgo.InteractionResponseData{
							Content: "You are already verified!",
							Flags:   discordgo.MessageFlagsEphemeral,
						},
					})
					return
				}
				err = s.GuildMemberRoleAdd(i.GuildID, i.Member.User.ID, verificationRoleID)
				if err != nil {
					s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
						Type: discordgo.InteractionResponseChannelMessageWithSource,
						Data: &discordgo.InteractionResponseData{
							Content: err.Error(),
							Flags:   discordgo.MessageFlagsEphemeral,
						},
					})
					return
				}
				s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
					Type: discordgo.InteractionResponseChannelMessageWithSource,
					Data: &discordgo.InteractionResponseData{
						Content: "You have been successfully verified! ✅",
						Flags:   discordgo.MessageFlagsEphemeral,
					},
				})
			}
		}
	})
	var verifychannel = "1338010927710208054"
	messages, err := discord.ChannelMessages(verifychannel, 100, "", "", "")
	if err != nil {
		fmt.Println("Error fetching messages:", err)
	} else {
		for _, message := range messages {
			err := discord.ChannelMessageDelete(verifychannel, message.ID)
			if err != nil {
				fmt.Println("Error deleting message:", err)
			}
		}
	}
	embed := &discordgo.MessageEmbed{
		Title: "Verification",
		Color: 0x7e22ce,
	}
	components := []discordgo.MessageComponent{
		discordgo.ActionsRow{
			Components: []discordgo.MessageComponent{
				discordgo.Button{
					Label:    "Verify",
					Style:    discordgo.PrimaryButton,
					CustomID: "verify_button",
				},
			},
		},
	}
	_, err = discord.ChannelMessageSendComplex(verifychannel, &discordgo.MessageSend{
		Embeds:     []*discordgo.MessageEmbed{embed},
		Components: components,
	})
	if err != nil {
		fmt.Println("Error sending message:", err)
	}

	// bot wont work without ts
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-sc
	//
}
