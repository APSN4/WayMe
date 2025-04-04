package internal

import (
	"fmt"
	"github.com/downflux/go-geometry/nd/vector"
	"github.com/downflux/go-kd/kd"
	"github.com/downflux/go-kd/point"
)

// P implements the point.P interface, which needs to provide a coordinate
// vector function P().
var _ point.P = &P{}

type P struct {
	p    vector.V
	info Place
}

type PlaceAPI struct {
	CoordinatesFloat vector.V `json:"coordinates_float"`
	Info             Place    `json:"info"`
}

var dataPlacesKD []*P

func (p *P) P() vector.V { return p.p }
func (p *P) Equal(q *P) bool {
	return vector.Within(p.P(), q.P()) &&
		p.info.ID == q.info.ID &&
		p.info.Name == q.info.Name &&
		p.info.GlobalID == q.info.GlobalID &&
		p.info.IsNetObject == q.info.IsNetObject &&
		p.info.OperatingCompany == q.info.OperatingCompany &&
		p.info.TypeObject == q.info.TypeObject &&
		p.info.AdmArea == q.info.AdmArea &&
		p.info.District == q.info.District &&
		p.info.Address == q.info.Address &&
		p.info.SeatsCount == q.info.SeatsCount &&
		p.info.SocialPrivileges == q.info.SocialPrivileges &&
		p.info.Longitude == q.info.Longitude &&
		p.info.Latitude == q.info.Latitude &&
		comparePhones(p.info.PublicPhone, q.info.PublicPhone)
}

func comparePhones(a, b []Phone) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func GetPointsRegion(x float64, y float64, radius int) []PlaceAPI {

	var places []PlaceAPI

	// Data is copy-constructed and may be read from outside the k-D tree.
	t := kd.New[*P](kd.O[*P]{
		Data: dataPlacesKD,
		K:    2,
		N:    1,
	})

	for _, p := range kd.KNN(
		t,
		/* v = */ vector.V{x, y},
		/* k = */ radius,
		func(p *P) bool { return true }) {
		fmt.Println(p)
		places = append(places, PlaceAPI{CoordinatesFloat: p.p, Info: p.info})
	}

	return places
}
