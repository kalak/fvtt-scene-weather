/*
Copyright (c) 2023 BlackStripedOne
This software is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License.

You may obtain a copy of the License at:
https://creativecommons.org/licenses/by-sa/4.0/legalcode

Code written by BlackStripedOne can be found at:
https://github.com/BlackStripedOne

This source is part of the SceneWeather module for FoundryVTT virtual tabletop game that can be found at:
https://github.com/BlackStripedOne/fvtt-scene-weather

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

import { Logger, Utils } from '../utils.js'
import { EVENTS, CLOUD_TYPE, PRECI_TYPE, HUMIDITY_LEVELS, SUN_INTENSITY, PRECI_AMOUNT, WIND_SPEED, CLOUD_HEIGHT, TEMP_TYPES } from '../constants.js'
import { WeatherPerception } from '../weatherPerception.js'
import { FoundryAbstractionLayer as Fal } from '../fal.js'

Hooks.on(EVENTS.REG_WEATHER_PERCIEVERS, async () => {
  Logger.debug('registered weatherPerciever for perceptive')
  Utils.getApi().registerPerciever('perceptive', new PerceptivePerciever())
})

class PerceptivePerciever extends WeatherPerception {

  isAllowed(userId) {
    return true
  }

  async getTextFromModel(weatherModel) {
    const weatherInfo = await this.getWeatherInfoFromModel(weatherModel)
    const compiledTemplate = Handlebars.compile(Utils.i18n('meteo.perceptiveText'))
    const weatherText = compiledTemplate(weatherInfo)
    return weatherText
  }

  async getUiHtmlFromModel(weatherModel) {
    const weatherInfo = await this.getWeatherInfoFromModel(weatherModel)
    const compiledTemplate = Handlebars.compile(Utils.i18n('meteo.perceptiveUi'))
    const weatherInfoHtml = compiledTemplate(weatherInfo)
    return weatherInfoHtml
  }

  async getWeatherInfoFromModel(weatherModel) {
    const weatherInfo = Fal.mergeObject(WeatherPerception.DEFAULT_WEATHER_STRUCT, PerceptivePerciever._calculateWeatherInfoFromModelData(weatherModel))
    Logger.debug('PerceptivePerciever.getWeatherInfoFromModel()', { 'weatherModel': weatherModel, 'weatherInfo': weatherInfo })
    return weatherInfo
  }

  getPercieverInfo() {
    const info = Fal.mergeObject(WeatherPerception.DEFAULT_INFO_STRUCT, {
      'id': 'perceptive',
      'name': 'meteo.perceptiveName'
    })
    Logger.debug('PerceptivePerciever.getPercieverInfo()', { 'info': info })
    return info
  }

  /**
 * Convert temperature in fahrenheit to celsius.
 *
 * @param Tf temperature in fahrenheit
 * @returns {number}
 */
  static _fahrenheitToCelsius(Tf) {
    return (Tf - 32) / 1.8
  }

  /**
   * Convert temperature in celsius to fahrenheit.
   *
   * @param Tc temperature in celsius
   * @returns {number}
   */
  static _celsiusToFahrenheit(Tc) {
    return (Tc * 1.8) + 32
  }


  /**
   * Given a precipitation type, returns a string identifier for the type in the format "meteo.<type>".
   * @param {string} type - A string representing the precipitation type to identify.
   * @returns {string} - A string identifier in the format "meteo.<type>".
   */
  static _getPrecipitationTypeId(type) {
    const [suffix] = Object.entries(PRECI_TYPE).find(([, val]) => val === type)
    return suffix ? `meteo.${suffix}` : 'meteo.none'
  }




  /**
   * Returns the precipitation amount id based on the amount of precipitation
   * @param {number} amount - The amount of precipitation
   * @returns {string} - The id of the precipitation amount
   * @example
   * _getPrecipitationAmountId(0.5); // 'meteo.light'
   */
  static _getPrecipitationAmountId(amount) {
    const [id] = Object.entries(PRECI_AMOUNT).find(([, level]) => amount < level)
    return `meteo.${id}`
  }


  /**
   * Returns a string representing the sun intensity level based on the input amount.
   * @param {number} amount - A number between 0 and 1 representing the amount of sun.
   * @returns {string} - A string representing the sun intensity level.
   * @example
   * const intensity = _getSunAmountId(0.6); // 'meteo.normal'
  */
  static _getSunAmountId(amount) {
    const [id] = Object.entries(SUN_INTENSITY).find(([, level]) => amount < level)
    return `meteo.${id}`
  }

  /**
   * Given a cloud type, returns a string identifier for the type in the format "meteo.<type>".
   * @param {string} type - A string representing the cloud type to identify.
   * @returns {string} - A string identifier in the format "meteo.<type>".
   */
  static _getCloudTypeId(type) {
    const [suffix] = Object.entries(CLOUD_TYPE).find(([, val]) => val === type)
    return suffix ? `meteo.${suffix}` : 'meteo.cumulunimbus'
  }


  /**
   * Returns the meteorological identifier for the cloud amount based on the input amount.
   * @param {number} amount - The amount of cloud cover, a number between 0 and 1.
   * @returns {string} - The meteorological identifier for the cloud amount.
   */
  static _getCloudAmountId(amount) {
    const octas = [
      'meteo.skc', // Sky Clear
      'meteo.few', // Few Clouds
      'meteo.few', // Few Clouds
      'meteo.sct', // Scattered Clouds
      'meteo.sct', // Scattered Clouds
      'meteo.bkn', // Broken Couds
      'meteo.bkn', // Broken Clouds
      'meteo.bkn', // Broken Clouds
      'meteo.ovc'  // Overcast
    ]
    return octas[Math.round(amount * 8)]
  }

  /**
   * Returns the cloud height identifier based on the provided height value.
   *
   * @param {number} height - The height value to determine the cloud height identifier for.
   * @returns {string} The cloud height identifier in the format 'meteo.{identifier}'.
  */
  static _getCloudHightId(height) {
    const [id] = Object.entries(CLOUD_HEIGHT).find(([, level]) => height < level)
    return `meteo.${id}`
  }


  /**
*
* Returns the ID of the wind direction based on the input direction angle.
* @param {number} direction - The wind direction angle in degrees.
* @returns {string} - The ID of the wind direction in the format "meteo.[direction]" where [direction] is the abbreviated direction name.
* For example, if the direction is 90 degrees (east), the function will return "meteo.e".
*/
  static _getWindDirId(direction) {
    let val = Math.floor((direction / 22.5) + 0.5)
    const arr = ["n", "nne", "ne", "ene", "e", "ese", "se", "sse", "s", "ssw", "sw", "wsw", "w", "wnw", "nw", "nnw"]
    return "meteo." + arr[(val % 16)]
  }


  /**
    * Returns the wind speed identifier for a given wind object
    * @param {Object} wind - The wind object containing speed and gusts properties
    * @returns {string} - The wind speed identifier
    */
  static _getWindSpeedId(wind) {
    let gusting = wind.gusts > 5 ? 'Gusting' : ''
    const [id] = Object.entries(WIND_SPEED).find(([, level]) => wind.speed < level)
    return `meteo.${id}${gusting}`
  }


  /**
    * Returns the humidity id that corresponds to a given humidity level.
    *
    * @param {number} humidity - The humidity level (in %).
    * @returns {string} The humidity id.
    */
  static _getHumidityId(humidity) {
    const [id] = Object.entries(HUMIDITY_LEVELS).find(([, level]) => humidity < level)
    return `meteo.${id}`
  }

  /**
     * Returns the perceived temperature category based on the input temperature.
     * @param {number} temperature - The temperature value to be categorized.
     * @returns {string} - The category of the perceived temperature.
     */
  static _getPercievedTempId(temperature) {
    const [id] = Object.entries(TEMP_TYPES).find(([, level]) => temperature < level)
    return `meteo.${id}`
  }

  static _calculateWeatherInfoFromModelData(modelData) {
    Logger.debug('PerceptivePerciever._calculateWeatherInfoFromModelData()', { 'modelData': modelData })
    return {
      'name': modelData.name,
      'temperature': {
        'air': Math.round(modelData.temp.air),
        'ground': Math.round(modelData.temp.ground),
        'percieved': Math.round(modelData.temp.percieved),
        'percievedId': PerceptivePerciever._getPercievedTempId(modelData.temp.percieved)
      },
      'humidity': {
        'percent': Math.round(modelData.humidity),
        'percentId': PerceptivePerciever._getHumidityId(modelData.humidity)
      },
      'wind': {
        'speed': Math.round(modelData.wind.speed),
        'gusts': Math.round(modelData.wind.gusts),
        'speedId': PerceptivePerciever._getWindSpeedId(modelData.wind),
        'direction': Math.round(modelData.wind.direction),
        'directionId': PerceptivePerciever._getWindDirId(modelData.wind.direction)
      },
      'clouds': {
        'height': Math.round(modelData.clouds.bottom),
        'heightId': PerceptivePerciever._getCloudHightId(modelData.clouds.bottom),
        'amount': Math.round(modelData.clouds.coverage * 100),
        'amountId': PerceptivePerciever._getCloudAmountId(modelData.clouds.coverage),
        'type': PerceptivePerciever._getCloudTypeId(modelData.clouds.type)
      },
      'sun': {
        'amount': Math.round(modelData.sun.amount * 100),
        'amountId': PerceptivePerciever._getSunAmountId(modelData.sun.amount)
      },
      'precipitation': {
        'amount': Math.round(modelData.precipitation.amount * 100),
        'amountId': PerceptivePerciever._getPrecipitationAmountId(modelData.precipitation.amount),
        'type': PerceptivePerciever._getPrecipitationTypeId(modelData.precipitation.type)
      }
    }
  }

}
