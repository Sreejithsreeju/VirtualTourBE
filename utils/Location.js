const axios = require('axios');
const HttpError = require('../models/http-error');

const API_KEY = "AIzaSyDtxs1wjj5F8t8WfGOjaND4rsjeWNZ1S0E";

//  function getCoordsForAddress(){

//     return {
//         lat: 10.7637057,
//         lng: 76.6549328
//     }
// }

//     const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`)

//     const data = response.data;
//     console.log(data)

//     if(!data || data.status === 'ZERO_RESULTS'){
//         const error = new HttpError('Could not find location for the specified address.',422);
//         throw error;
//     }

// const coordinates = data.results[0].geometry.location;
//     console.log(coordinates)
//     return coordinates;

// }
const getCoordsForAddress = async (address) => {
    const response = await axios.get(
      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates',
      {
        params: {
          f: 'json',
          singleLine: address,
          outFields: 'Match_addr,Addr_type'
        }
      }
    );
   
    const data = response.data;
   
    // Check if no matches were found
    if (!data || data.candidates.length === 0) {
      const error = new HttpError(
        'Could not find location for the specified address.',
        422
      );
      throw error;
    }
   
    // Get Latitude
    const lat = response.data.candidates[0].location.y;
    // Get Longitude
    const lng = response.data.candidates[0].location.x;
   
    return {
      lat,
      lng
    };
  };
module.exports = getCoordsForAddress;