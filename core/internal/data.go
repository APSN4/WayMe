package internal

import (
	"encoding/json"
	"fmt"
	"github.com/downflux/go-geometry/nd/vector"
	"log"
	"os"
	"path/filepath"
	"strconv"
)

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

var dataPlaces []Place

func GetGlobalPlacesFile() {
	currentDir, err := os.Getwd()
	if err != nil {
		log.Fatalln(err)
	}
	dataDir := filepath.Join(currentDir, "internal", "storage", "data_places.json")
	data, err := os.ReadFile(dataDir)
	if err != nil {
		log.Fatalln(err)
	}
	err = json.Unmarshal(data, &dataPlaces)
	if err != nil {
		fmt.Println("Error Unmarshal in GetGlobalPlacesFile")
	}

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
