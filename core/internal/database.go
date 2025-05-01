package internal

import (
	"encoding/json"
	"fmt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"os"
	"path/filepath"
)

var ConDB *gorm.DB

type PlaceDB struct {
	gorm.Model
	ID               string    `json:"ID"`
	Name             string    `json:"Name"`
	GlobalID         int       `gorm:"primaryKey" json:"global_id"`
	IsNetObject      string    `json:"IsNetObject"`
	OperatingCompany string    `json:"OperatingCompany"`
	TypeObject       string    `json:"TypeObject"`
	AdmArea          string    `json:"AdmArea"`
	District         string    `json:"District"`
	Address          string    `json:"Address"`
	PublicPhone      []PhoneDB `gorm:"foreignKey:PlaceID" json:"-"`
	SeatsCount       int       `json:"SeatsCount"`
	SocialPrivileges string    `json:"SocialPrivileges"`
	Longitude        string    `json:"Longitude_WGS84"`
	Latitude         string    `json:"Latitude_WGS84"`
}

type KnowledgeDB struct {
	gorm.Model
	ID     string `gorm:"primaryKey"`
	Type   string
	Prompt string
}

type PhoneDB struct {
	gorm.Model
	PlaceID uint
	Number  string `gorm:"size:20"`
}

func StartDB() *gorm.DB {
	db, err := gorm.Open(sqlite.Open("storage/gorm.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	err = db.AutoMigrate(&PlaceDB{}, &KnowledgeDB{}, &PhoneDB{})
	if err != nil {
		panic("failed to auto migrate tables")
	}
	return db
}

func JsonToDB() error {
	currentDir, err := os.Getwd()
	if err != nil {
		return err
	}
	dataDir := filepath.Join(currentDir, "storage", "data_places.json")
	data, err := os.ReadFile(dataDir)
	if err != nil {
		return err
	}

	err = json.Unmarshal(data, &dataPlaces)
	if err != nil {
		fmt.Println("Error Unmarshal in JsonToDB")
		return err
	}

	var placesDB []PlaceDB
	for i := range dataPlaces {
		placesDB = append(placesDB, dataPlaces[i].ToDBModel())
	}

	err = ConDB.Clauses(clause.OnConflict{DoNothing: true}).
		CreateInBatches(placesDB, 100).Error
	if err != nil {
		return err
	}

	return nil
}

func (p *Place) ToDBModel() PlaceDB {
	placeDB := PlaceDB{
		GlobalID:         p.GlobalID,
		Name:             p.Name,
		IsNetObject:      p.IsNetObject,
		OperatingCompany: p.OperatingCompany,
		TypeObject:       p.TypeObject,
		AdmArea:          p.AdmArea,
		District:         p.District,
		Address:          p.Address,
		SeatsCount:       p.SeatsCount,
		SocialPrivileges: p.SocialPrivileges,
		Longitude:        p.Longitude,
		Latitude:         p.Latitude,
	}

	// Convert phones
	for _, phone := range p.PublicPhone {
		placeDB.PublicPhone = append(placeDB.PublicPhone, PhoneDB{
			Number: phone.PublicPhone,
		})
	}

	return placeDB
}

func (p *PlaceDB) ToDomainModel() Place {
	place := Place{
		GlobalID:         p.GlobalID,
		Name:             p.Name,
		IsNetObject:      p.IsNetObject,
		OperatingCompany: p.OperatingCompany,
		TypeObject:       p.TypeObject,
		AdmArea:          p.AdmArea,
		District:         p.District,
		Address:          p.Address,
		SeatsCount:       p.SeatsCount,
		SocialPrivileges: p.SocialPrivileges,
		Longitude:        p.Longitude,
		Latitude:         p.Latitude,
	}

	// Convert phones
	for _, phone := range p.PublicPhone {
		place.PublicPhone = append(place.PublicPhone, Phone{PublicPhone: phone.Number})
	}

	return place
}
