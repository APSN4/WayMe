package internal

import (
	"encoding/json"
	"fmt"
	"os"
)

type Place struct {
	ID               string  `json:"ID"`
	Name             string  `json:"Name"`
	globalID         int     `json:"global_id"`
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

var dataPlaces []Place

func GetGlobalPlacesFile() {
	data, err := os.ReadFile("storage/data_places.json")
	err = json.Unmarshal(data, &dataPlaces)
	if err != nil {
		fmt.Println("Error Unmarshal in GetGlobalPlacesFile")
	}
}
