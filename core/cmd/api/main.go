package main

import (
	"core/internal"
	"core/internal/api"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"time"
)

func main() {
	r := gin.Default()

	db := internal.StartDB()
	internal.ConDB = db

	err := internal.JsonToDB()
	if err != nil {
		panic("internal.JsonToDB()")
	}

	internal.GetGlobalPlacesFile()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"PUT", "PATCH", "GET", "POST"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	v1 := r.Group("v1")
	{
		v1.GET("/markers", api.GetMarkers)
		v1.POST("/generate", api.LLMPipeline)
	}

	r.Run()
}
