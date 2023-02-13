/**
 * Module-based constants
 */
export const MODULE = {
  ID: 'scene-weather',
  NAME: 'Scene Weather',
  LCCNAME: 'sceneWeather'
}

export const METEO = {
  'isaMSLtempC': 16,  // default temperature for the ISA at mean sea level in degC
  'isaSeaLevelPa': 101325, // default air pressure for the ISA at mean sea level in Pa
  'adiabaticHyDryCoeff': -0.0065, // coefficient between dry adiabadic and hygro adiabatic cooling on ascent per meter altitude
  'g': 9.80665,
  'mAir': 0.0289644, // molar mass of Earth's air: 0.0289644 kg/mol
  'R': 8.3144598, // universal gas constant: 8.3144598 J/(mol·K)'
  'Tzero': 237.7 // saturation vapor pressure in Kelvin, over a flat surface of water
}
