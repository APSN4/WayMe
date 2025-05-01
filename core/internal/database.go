package internal

import (
	"encoding/json"
	"fmt"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"log"
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
	Number string
	Prompt string
}

type PhoneDB struct {
	gorm.Model
	PlaceID uint
	Number  string `gorm:"size:20"`
}

func StartDB() *gorm.DB {
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println(".env file not loaded:", err)
	}

	host := os.Getenv("POSTGRES_HOST")
	port := os.Getenv("POSTGRES_PORT")
	user := os.Getenv("POSTGRES_USER")
	password := os.Getenv("POSTGRES_PASSWORD")
	dbname := os.Getenv("POSTGRES_DB")

	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=UTC",
		host, port, user, password, dbname,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("failed to connect to PostgreSQL: " + err.Error())
	}

	err = db.AutoMigrate(&PlaceDB{}, &KnowledgeDB{}, &PhoneDB{})
	if err != nil {
		panic("failed to auto migrate tables: " + err.Error())
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

func ExecutePlaceSQL(sqlText string) (PlaceDB, error) {
	var globalID int

	err := ConDB.Raw(sqlText).Scan(&globalID).Error
	if err != nil {
		return PlaceDB{}, err
	}

	var place PlaceDB
	err = ConDB.Where("global_id = ?", globalID).First(&place).Error
	if err != nil {
		return PlaceDB{}, err
	}

	return place, nil
}
