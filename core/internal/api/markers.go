package api

import (
	"github.com/gin-gonic/gin"
	"log"
)

func GetMarkers(c *gin.Context) {
	xSCoordinate := c.Query("x1")
	ySCoordinate := c.Query("y1")
	xECoordinate := c.Query("x2")
	yECoordinate := c.Query("y2")

	log.Println(xSCoordinate, ySCoordinate, xECoordinate, yECoordinate)
}
