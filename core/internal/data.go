package internal

import (
	"github.com/downflux/go-geometry/nd/vector"
	"strconv"
)

var TypeObjectNames = map[string]string{
	"cafe":        "кафе",
	"restaurants": "ресторан",
	"fastFood":    "предприятие быстрого обслуживания",
}

type LLMRequest struct {
	Text string `json:"text"`
}

type Place struct {
	ID               string  `json:"ID"`
	Name             string  `json:"Name"`
	GlobalID         int     `json:"global_id"`
	IsNetObject      string  `json:"IsNetObject"`
	OperatingCompany string  `json:"OperatingCompany"`
	TypeObject       string  `json:"TypeObject"`
	AdmArea          string  `json:"AdmArea"`
	District         string  `json:"District"`
	Address          string  `json:"Address"`
	PublicPhone      []Phone `json:"PublicPhone"`
	SeatsCount       int     `json:"SeatsCount"`
	SocialPrivileges string  `json:"SocialPrivileges"`
	Longitude        string  `json:"Longitude_WGS84"`
	Latitude         string  `json:"Latitude_WGS84"`
}

type Phone struct {
	PublicPhone string `json:"PublicPhone"`
}

type OllamaResponse struct {
	Model              string `json:"model"`
	CreatedAt          string `json:"created_at"`
	Response           string `json:"response"`
	Done               bool   `json:"done"`
	DoneReason         string `json:"done_reason"`
	TotalDuration      int64  `json:"total_duration"`
	LoadDuration       int64  `json:"load_duration"`
	PromptEvalCount    int    `json:"prompt_eval_count"`
	PromptEvalDuration int64  `json:"prompt_eval_duration"`
	EvalCount          int    `json:"eval_count"`
	EvalDuration       int64  `json:"eval_duration"`
}

var dataPlaces []Place

func GetGlobalPlacesFile() {
	for _, k := range dataPlaces {
		if k.Latitude == "" || k.Longitude == " " {
			continue
		}
		x, err := strconv.ParseFloat(k.Longitude, 64)
		if err != nil {
			panic(err)
		}
		y, err := strconv.ParseFloat(k.Latitude, 64)
		if err != nil {
			panic(err)
		}
		dataPlacesKD = append(dataPlacesKD, &P{p: vector.V{x, y}, info: k})
	}
}
