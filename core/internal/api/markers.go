package api

import (
	"core/internal"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"strconv"
	"strings"
)

func GetMarkers(c *gin.Context) {
	xCoordinate := c.Query("x")
	yCoordinate := c.Query("y")
	radius := c.Query("radius")
	filter := c.Query("filter")

	log.Println(xCoordinate, yCoordinate, radius)
	xCoordinateF, err := strconv.ParseFloat(xCoordinate, 64)
	if err != nil {
		log.Println(err)
	}
	yCoordinateF, err := strconv.ParseFloat(yCoordinate, 64)
	if err != nil {
		log.Println(yCoordinateF)
	}
	radiusI, err := strconv.ParseInt(radius, 10, 64)
	if err != nil {
		log.Println(err)
	}
	filterList := strings.Split(filter, ",")
	places := internal.GetPointsRegion(xCoordinateF, yCoordinateF, radiusI, filterList)
	if places != nil {
		c.JSON(http.StatusOK, places)
	} else {
		c.JSON(http.StatusInternalServerError, places)
	}
}
