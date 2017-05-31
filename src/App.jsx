/* eslint-env browser */
import React, {Component} from 'react';
import L from 'leaflet';
import {Map, CircleMarker, Popup, TileLayer} from 'react-leaflet';
import throttle from 'lodash/throttle';

const position = [60.18473940692944, 24.941736668014514];

const apiCall = (url, body, params = {}) => {
  const init = Object.assign({
    method: 'POST',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }, params);
  return fetch(url, init).then(resp => resp.json());
};

const RestaurantMarker = ({restaurant}) => (
  <CircleMarker center={restaurant.latLng} radius={5} key={restaurant.id}>
    <Popup>
      <h2>{restaurant.name}</h2>
    </Popup>
  </CircleMarker>
);

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {cityData: null, restaurants: {}, visibleRestaurants: []};
    this.throttledLoadRestaurants = throttle(this.loadRestaurants.bind(this), 1000);
    this.throttledUpdateVisibleRestaurants = throttle(this.updateVisibleRestaurants.bind(this), 500);
    this.handleMove = this.handleMove.bind(this);
  }

  componentDidMount() {
    /*
     const [lat, lng] = position;
     apiCall('/api/Cities/nearestCity', {lat, lng, locale: 'fi'}).then(cityData => this.setState({cityData}));
     */
    this.loadRestaurants();
  }

  handleMove() {
    this.throttledLoadRestaurants();
    this.throttledUpdateVisibleRestaurants();
  }


  loadRestaurants() {
    const map = this.map;
    if (!map) return;
    const bounds = map.leafletElement.getBounds();
    apiCall('/api/Restaurants/findForMapView', {
      bottomLat: bounds.getSouth(),
      bottomLng: bounds.getWest(),
      topLat: bounds.getNorth(),
      topLng: bounds.getEast(),
      idArr: [],
      locale: 'fi',
    }).then((restaurantList) => {
      const currentRestaurants = this.state.restaurants;
      const newRestaurants = {};
      let nNew = 0;
      restaurantList.forEach((restaurant) => {
        if (currentRestaurants[restaurant.id]) return;
        restaurant.latLng = new L.LatLng(restaurant.latitude, restaurant.longitude);
        restaurant.marker = <RestaurantMarker restaurant={restaurant} key={restaurant.id} />;
        newRestaurants[restaurant.id] = restaurant;
        nNew += 1;
      });
      console.log('loaded', nNew, '/', restaurantList.length, 'restaurants in bounds', bounds.toBBoxString());
      if (!nNew) return;
      this.setState(
        {restaurants: Object.assign(currentRestaurants, newRestaurants)},
        () => this.throttledUpdateVisibleRestaurants()
      );
    });
  }

  updateVisibleRestaurants() {
    const {restaurants} = this.state;
    let visibleRestaurants = [];
    if (this.map) {
      const bounds = this.map.leafletElement.getBounds();
      visibleRestaurants = Object.values(restaurants).filter(r => bounds.contains(r.latLng)).slice(0, 300);
    }
    this.setState({visibleRestaurants});
  }

  render() {
    const {visibleRestaurants} = this.state;
    return (<div>
      <Map
        center={position}
        zoom={13}
        style={{height: '100vh'}}
        onMove={this.handleMove}
        ref={(map) => {
          this.map = map;
        }}
      >
        <TileLayer
          url="http://{s}.tile.osm.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {visibleRestaurants.map(restaurant => restaurant.marker)}
      </Map>
      <div id="overlay">
        <ul>
          {visibleRestaurants.map(restaurant => <li key={restaurant.id}>{restaurant.name}</li>)}
        </ul>
      </div>
    </div>);
  }
}
