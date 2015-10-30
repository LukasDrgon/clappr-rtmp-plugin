// Copyright 2014 Globo.com Player authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

import {Browser} from 'clappr'
import {Events} from 'clappr'
import {Flash} from 'clappr'
import {Mediator} from 'clappr'
import {Styler} from 'clappr'
import template from 'clappr/src/base/template'

import flashHTML from 'html!../public/flash.html'
import flashStyle from '!raw!sass!../public/flash.scss'

export default class RTMP extends Flash {
    get name() { return 'rtmp' }
    get tagName() { return 'object' }
    get template() { return template(flashHTML) }
    get attributes() {
        return {
            'data-rtmp': '',
            'type': 'application/x-shockwave-flash',
            'width': '100%',
            'height': '100%'
        }
    }

    constructor(options) {
        super(options)
        this.options = options
        this.options.wmode = options.wmode || 'transparent' // Default to transparent wmode - IE always uses gpu as per objectIE
        this.options.bufferTime = options.bufferTime || 0.1
        this.options.scaling = options.scaling || 'letterbox'
        this.options.playbackType = this.options.playbackType || this.options.src.indexOf('live') > -1
        this.setupPlaybackType()
    }

    get swfPath() {
        return this.options.swfPath ? this.options.swfPath : "//cdn.jsdelivr.net/clappr.rtmp/latest/assets/RTMP.swf"
    }

    get playbackType() {
        return this.options.playbackType
    }

    addListeners() {
        Mediator.on(this.uniqueId + ':progress', this.progress, this)
        Mediator.on(this.uniqueId + ':timeupdate', this.updateTime, this)
        Mediator.on(this.uniqueId + ':statechanged', this.checkState, this)
        Mediator.on(this.uniqueId + ':flashready', this.bootstrap, this)
    }

    stopListening() {
        super.stopListening()
        Mediator.off(this.uniqueId + ':progress')
        Mediator.off(this.uniqueId + ':timeupdate')
        Mediator.off(this.uniqueId + ':statechanged')
        Mediator.off(this.uniqueId + ':flashready')
    }

    bootstrap() {
        this.el.width = '100%'
        this.el.height = '100%'
        this.isReady = true
        this.trigger(Events.PLAYBACK_READY, this.name)
        this.options.autoPlay && this.play()
    }

    setupPlaybackType() {
        if (this.playbackType === 'live') {
            this.settings = {'left': ["playpause"], 'default': ['seekbar'], 'right': ['fullscreen', 'volume']}
            this.settings.seekEnabled = false
            this.trigger(Events.PLAYBACK_SETTINGSUPDATE)
        }
    }

    render() {
        this.$el.html(this.template({ cid: this.cid, swfPath: this.swfPath, playbackId: this.uniqueId, wmode: this.options.wmode, scaling: this.options.scaling,
                                      bufferTime: this.options.bufferTime, playbackType: this.options.playbackType }))
        if (Browser.isIE) {
            this.$('embed').remove()
            if (Browser.isLegacyIE) {
                this.$el.attr('classid', IE_CLASSID)
            }
        } else if (Browser.isFirefox) {
            this.setupFirefox()
        }
        this.el.id = this.cid
        var style = Styler.getStyleFor(flashStyle)
        this.$el.append(style)
        return this
    }
}

RTMP.canPlay = function (source) {
    return !!(source.indexOf('rtmp://') > -1 && Browser.hasFlash)
};
