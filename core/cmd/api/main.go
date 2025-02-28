package main

import (
	"core/internal/api"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	v1 := r.Group("v1")
	{
		v1.GET("/markers", api.GetMarkers)
	}

	r.Run()
}
