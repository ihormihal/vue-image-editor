<template>
  <div class="full">

    <div class="box2 text-center show-md-under">
      <h2 class="primary-dark">Editor</h2>
      <div class="text-subline center"></div>
    </div>

    <div class="row condensed">
      <div class="col-md-6">
        <div class="column">
          <div class="box">
            <div class="preview Frame">
              <img class="background" :src="frame" alt="">
              <Preview :matrix="matrix" v-if="image" ref="preview" :image="image" :transform="transform" @resized="areaResized" @loaded="imageLoaded" @moved="imageMoved" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="column pt3">

          <div class="box image-editor-form relative">

            <div class="pb1 hide-md-under">
              <h2 class="primary-dark">Editor</h2>
              <div class="text-subline"></div>
            </div>

            <div class="form-group">
              <label>Zoom</label>
              <div class="zoom-control mt2">
                <div class="minus"></div>
                <input type="range" :min="minZoom" :max="maxZoom" step="any" @change="onZoomEnd" v-model.number="transform.zoom" :disabled="!imageReady" />
                <div class="plus"></div>
              </div>
            </div>

            <div class="mt2 flex-row">
              <div class="btn-icon icon-rotate-left" @click="rotateMinus" :disabled="!imageReady"><span>Rotate left</span></div>
              <div class="btn-icon icon-rotate-right" @click="rotatePlus" :disabled="!imageReady"><span>Rotate right</span></div>
              <div class="btn-icon icon-flop" @click="flipY" :disabled="!imageReady"><span>Flip horizontal</span></div>
              <div class="btn-icon icon-flip" @click="flipX" :disabled="!imageReady"><span>Flip vertical</span></div>
            </div>

            <div class="mt3 btn-group text-md-center">
              <button class="btn btn-primary btn-loading" :class="{load: nextLoading}" type="button" @click="updateImage" :disabled="!imageReady">Save</button>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import config from '@/config';
import Preview from '@/components/ui/preview';

class Transform {
  constructor(center, matrix){
    this.init(center, matrix);
  }

  init(center, matrix){
    if(center) this.center = Object.assign({},center);
    if(matrix) this.matrix = Object.assign({},matrix);
  }

  getOrigins(current){
    //переходим в локальную систему кординат
    let tr = {x: current.x - this.center.x, y: current.y - this.center.y};
    //рассчитываем обратную трансформацию и переходим в нулевую систему кординат
    const det = 1/(this.matrix.a*this.matrix.d - this.matrix.c*this.matrix.b);
    const x = ( this.matrix.d*(tr.x - this.matrix.tx) - this.matrix.c*(tr.y - this.matrix.ty) ) * det + this.center.x;
    const y = (-this.matrix.b*(tr.x - this.matrix.tx) + this.matrix.a*(tr.y - this.matrix.ty) ) * det + this.center.y;
    return {x, y};
  }

  translate(current){
    //переходим в локальную систему кординат
    const origin = {x: current.x - this.center.x, y: current.y - this.center.y};
    //рассчитаем трансформацию и возвращаемся во внешнюю систему кординат
    let x = this.matrix.a*origin.x + this.matrix.c*origin.y + this.matrix.tx + this.center.x;
    let y = this.matrix.b*origin.x + this.matrix.d*origin.y + this.matrix.ty + this.center.y;
    return {x, y};
  }
}

function getRotation(deg, matrix = false) {
  let rotation = deg%360;
  if(deg < 0) rotation = 360 + rotation;
  if(rotation == 360) rotation = 0;
  return rotation;
}

function getMatrix(transform) {
  let scaleX = transform.flop ? transform.zoom : transform.zoom;
  let scaleY = transform.flip ? -transform.zoom : transform.zoom;
  let tx = transform.x;
  let ty = transform.y;
  const cos = Math.cos(transform.rotate * Math.PI / 180);
  const sin = Math.sin(transform.rotate * Math.PI / 180);
  let a = Math.round(cos)*scaleX;
  let b = Math.round(sin)*scaleX;
  let c = -Math.round(sin)*scaleY;
  let d = Math.round(cos)*scaleY;

  //flop: a < 0
  //flip: d < 0
  //rotate: a == 0 && d == 0

  return { a, b, c, d, tx, ty };
}

export default {
  components: { Preview },
  data () {
    return {
      clip: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      type: null,
      image: null,
      imageReady: false,
      imageRect: {},
      areaRect: {},
      minZoomValues: {},
      minZoom: 0.5,
      maxZoom: 2,
      transform: {
        center: {
          x: 0,
          y: 0,
        },
        zoom: 1,
        rotate: 0,
        flip: false,
        flop: false,
        x: 0,
        y: 0
      },
      loadedTransform: null,
      nextLoading: false,
      frame: 'assets/images/frame-printme-white.png'
    }
  },
  computed: {
    matrix() {
      let scaleX = this.transform.flop ? -this.transform.zoom : this.transform.zoom;
      let scaleY = this.transform.flip ? -this.transform.zoom : this.transform.zoom;
      let tx = this.transform.x;
      let ty = this.transform.y;
      const cos = Math.cos(this.transform.rotate * Math.PI / 180);
      const sin = Math.sin(this.transform.rotate * Math.PI / 180);
      let a = Math.round(cos)*scaleX;
      let b = Math.round(sin)*scaleX;
      let c = -Math.round(sin)*scaleY;
      let d = Math.round(cos)*scaleY;

      return { a, b, c, d, tx, ty };
    }
  },
  mounted(){
    this.image = 'assets/images/demo.jpg';
  },
  methods: {

    imageLoaded(rect){
      this.imageReady = true;
      this.imageRect = rect;
      this.imageRect = {
        size: {
          width: rect.size.width,
          height: rect.size.height
        },
        center: {
          x: rect.center.x,
          y: rect.center.y
        }
      };

      this._setMinZoom();
      this._setMaxZoom();
      this.transform.zoom = this.minZoom;

      if(this.loadedTransform) this.transform = this.loadedTransform;
      this._translate();
    },

    _setMinZoom(){
      let rotate = this.matrix.c !== 0;
      let horizontal = this.imageRect.size.height < this.imageRect.size.width;
      let areaSize = (horizontal && !rotate || !horizontal && rotate) ? this.areaRect.size.width : this.areaRect.size.height;
      let imageSize = horizontal ? this.imageRect.size.width : this.imageRect.size.height;

      this.minZoom = areaSize/imageSize;
      if(this.transform.zoom < this.minZoom) this.transform.zoom = this.minZoom;
    },

    _setMaxZoom(){
      this.maxZoom = this.areaRect.size.width/config.image.minResolution;
      if(this.transform.zoom > this.maxZoom) this.transform.zoom = this.maxZoom;
    },

    areaResized(rect){
      this.areaRect = rect;
      if(this.imageReady) this._translate();
    },

    onZoomEnd(){
      this._translate();
    },

    flipX(){
      this.matrix.b == 0 && this.matrix.c == 0
      ? this.transform.flip = !this.transform.flip
      : this.transform.flop = !this.transform.flop;
    },

    flipY(){
      this.matrix.b == 0 && this.matrix.c == 0
      ? this.transform.flop = !this.transform.flop
      : this.transform.flip = !this.transform.flip;
    },

    rotatePlus(){
      this.transform.rotate += 90;
      this._setMinZoom();
      this._translate();
    },

    rotateMinus(){
      this.transform.rotate -= 90;
      this._setMinZoom();
      this._translate();
    },

    imageMoved(translate){
      this._translate();
    },

    _translate(checkAlign = true){
      const tr = new Transform(this.transform.center, this.matrix);

      //находим координаты, которые, после трансформации, должны совпасть с центром области кропа
      const newCenter = tr.getOrigins(this.areaRect.center);
      this.transform.center = newCenter;
      //пересчитываем смещение для компенсации сдвига центра
      this.transform.x = this.areaRect.center.x - newCenter.x;
      this.transform.y = this.areaRect.center.y - newCenter.y;

      //обновляем координаты центра
      tr.init(this.transform.center, this.matrix);

      //рассчитываем кординаты верхнего левого и нижнего правого углов изображения, которые получились после применения трансформации
      let x0y0 = tr.translate({x: 0, y: 0});
      let x1y1 = tr.translate({x: this.imageRect.size.width, y: this.imageRect.size.height});

      //находим расположение (относительно области кропа) крайних точек изображения и его размер
      let result = {
        left: x1y1.x - x0y0.x > 0 ? x0y0.x : x1y1.x,
        top: x1y1.y - x0y0.y > 0 ? x0y0.y : x1y1.y,
        width: Math.abs(x1y1.x - x0y0.x),
        height: Math.abs(x1y1.y - x0y0.y)
      };

      //находим смещения относительно области кропа и выравниваем изображение, если появились "зазоры"
      //align functions
      let rightOffset = this.areaRect.size.width - (result.left + result.width);
      let bottomOffset = this.areaRect.size.height - (result.top + result.height);

      let alignedCenter;


      //вырайниваем по горизонтали
      if(this.areaRect.size.width - result.width > 1){
        //align center X
        alignedCenter = tr.getOrigins({x: result.left + result.width/2, y: this.areaRect.center.y});
      }else{
        //align left
        if(result.left > 0){
          alignedCenter = tr.getOrigins({x: result.left + this.areaRect.center.x, y: this.areaRect.center.y});
        //align right
        }else if(rightOffset > 0){
          alignedCenter = tr.getOrigins({x: this.areaRect.center.x - rightOffset, y: this.areaRect.center.y});
        }
      }

      if(alignedCenter){
        this.transform.center = alignedCenter;
        this.transform.x = this.areaRect.center.x - alignedCenter.x;
        this.transform.y = this.areaRect.center.y - alignedCenter.y;
        tr.init(this.transform.center, this.matrix);
      }

      //вырайниваем по вертикали
      if(this.areaRect.size.height - result.height > 1){
        //align center Y
        alignedCenter = tr.getOrigins({x: this.areaRect.center.x, y: result.top + result.height/2});
      }else{
        //align top
        if(result.top > 0){
          alignedCenter = tr.getOrigins({x: this.areaRect.center.x, y: result.top + this.areaRect.center.y});
        //align bottom
        }else if(bottomOffset > 0){
          alignedCenter = tr.getOrigins({x: this.areaRect.center.x, y: this.areaRect.center.y - bottomOffset});
        }
      }

      if(alignedCenter){
        this.transform.center = alignedCenter;
        this.transform.x = this.areaRect.center.x - alignedCenter.x;
        this.transform.y = this.areaRect.center.y - alignedCenter.y;
        tr.init(this.transform.center, this.matrix);
      }

    },

    updateImage(){
      const tr = new Transform(this.transform.center, this.matrix);
      let topLeft = tr.getOrigins({x: 0, y: 0});
      let bottomRight = tr.getOrigins({x: this.areaRect.size.width, y: this.areaRect.size.height});

      const left = topLeft.x < bottomRight.x ? Math.round(topLeft.x) : Math.round(bottomRight.x);
      const top = topLeft.y < bottomRight.y ? Math.round(topLeft.y) : Math.round(bottomRight.y);
      const width = Math.round(Math.abs(bottomRight.x - topLeft.x));
      const height = Math.round(Math.abs(bottomRight.y - topLeft.y));

      const data = {
        transform: this.transform,
        crop: {
          size: this.imageRect.size,
          original: this.transform,
          flip: this.transform.flip,
          flop: this.transform.flop,
          rotate: this.transform.rotate,
          crop: { left, top, width, height }
        }
      };

      this.nextLoading = true;

      console.log(data)
      alert(JSON.stringify(data))
      //some API

      this.nextLoading = false;
    }

  }
}
</script>

<style lang="css">
  .overflow {
    overflow: hidden;
  }
</style>
