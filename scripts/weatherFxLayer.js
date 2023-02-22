import { Logger } from './utils.js'
import { WeatherEffect } from './weatherFx.js'

export class WeatherEffectsLayer extends CanvasLayer {

  /**
   * Container for particle effects overlay
   * 
   * @type {PIXI.Container | undefined}
   */
  particleEffectsContainer

  /**
   * List of currently active instances of WeatherEffect. Used for asynchronously keeping track of stopping and destroying effects
   * 
   * @type {WeatherEffect | []}
   */
  activeEffects = []

  /**
   * List of currently active instances of PIXI.filters.AdjustmentFilter. Used for asynchronously keeping track of stopping and destroying filters
   * 
   * @type {PIXI.filters.AdjustmentFilter | {}}
   */
  activeFilters = {}

  /**
   * Construct new scene weather effect layer as well as register it to the game ticker
   */
  constructor() {
    super()
    canvas.app.ticker.add(this.handleTick, this)
  }

  /**
   * Define an elevation property on the ParticleEffectsLayer layer.
   * Render SceneWeather Effects above default weather effects from foundry.
   * 
   * @type {number}
   */
  get elevation() { return (canvas.weather?.elevation ?? 9999) + 1 }
  set elevation(value) {
    const weatherEffects = canvas.weather
    if (weatherEffects) {
      weatherEffects.elevation = value - 1
    }
  }

  /**
   * Return default layer options
   */
  static get layerOptions() {
    return foundry.utils.mergeObject(super.layerOptions, { name: "weather-particle-effects" })
  }

  /**
   * Draw this layer. This will call the internal drawing
   */
  async _draw() {
    await this.drawParticleEffects()
    await this.drawFilterEffects()
  }

  /**
   * Tears down this layer and stopps all emitters and filters
   * 
   * @returns 
   */
  async _tearDown() {
    Logger.debug('WeatherEffectsLayer._tearDown()', { 'effects': this.activeEffects })
    this.activeEffects.forEach((effect => {
      effect.destroy()
    }))
    this.activeEffects = []
    this.particleEffectsContainer = undefined

    // TODO teardown filters
    return super._tearDown()
  }
  
  /**
   * Called game by ticker 
   */
  handleTick() {
    for (const key in this.activeFilters) {
      this.activeFilters[key].step()
    }
  }

  /**
   * TODO Draws the emitters for particle effects
   * 
   * @param {object} options soft -> ease out and ease in
   * @returns 
   */
  async drawFilterEffects({ soft = false } = {}) {
    if (!canvas.scene) return

    // Stop all existing filters
    const promises = Object.values(this.activeFilters).map((filter) => filter.destroy())
    await Promise.all(promises)

    // remove stopped filtes from canvas layer
    const activeFilters = Object.values(this.activeFilters)
    canvas.environment.filters = canvas.environment.filters?.filter(function (objFromA) {
      return !activeFilters.find(function (objFromB) {
        return objFromA === objFromB
      })
    }) ?? []
    this.activeFilters = {}

    // Get and initialize filters
    const filterConfigs = game.sceneWeather.get().getSceneWeatherFxFilters()
    Object.entries(filterConfigs).map(([id, config]) => {
      this.activeFilters[id] = new config.type({
        'soft': soft,
        'options': foundry.utils.mergeObject(config, { "-=type": null }, { performDeletions: true })
      })
      canvas.environment.filters.push(this.activeFilters[id])
    })
  }

  /**
   * TODO Draws the filters
   * 
   * @param {object} options soft -> ease out and ease in
   * @returns 
   */
  async drawParticleEffects({ soft = false } = {}) {
    if (!canvas.scene) return
    if (!this.particleEffectsContainer) {
      this.particleEffectsContainer = this.addChild(new PIXI.Container())
    }

    const stopPromise = Promise.all(this.activeEffects.map(async (effect) => {
      if (soft) {
        await effect.softStop({ gracePeriod: 10 }) // Give 30s grace period for particles to die by themselves. Clouds will take longest.
      } else {
        effect.stop()
      }
      // Remove stopped effect from list of active effects
      const index = this.activeEffects.indexOf(effect);
      if (index > -1) { // only splice array when effect is found
        this.activeEffects.splice(index, 1)
      }
    }))

    const fxEnabled = true  // TODO via config and setting

    if (fxEnabled) {
      const newEffect = new WeatherEffect(this.particleEffectsContainer, {})
      newEffect.play({ easeIn: soft })
      this.activeEffects.push(newEffect)
    }

    Logger.debug('waiting for emitters to clean up softly', { 'effects': this.activeEffects })
    await stopPromise
    Logger.debug('cleaned up emitters', { 'effects': this.activeEffects })
  }
}