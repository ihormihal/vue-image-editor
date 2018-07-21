<!-- Component for editing images -->
<template>

  <div>
    <div ref="area" class="edit-zone windows-loader" :class="{'load': loading}"
      @mousedown="onMoveStart"
      @touchstart="onMoveStart"
      @mouseup="onMoveEnd"
      @touchend="onMoveEnd"
      @mousemove="onMove"
      @touchmove="onMove">
      <div class="spinner"></div>
      <img v-if="image" ref="image" @load="imageLoaded" :src="image" :style="{ 'transform': transformStyle, 'transform-origin': transformOrigin }">
    </div>
  </div>

</template>

<script>
const areaSize = 512;

export default {
  props: {
    image: String,
    transform: Object,
    matrix: Object
  },
  data() {
    return {
      loading: true,
      m: {
        moving: false,
      	clickPosition: {
      		x: 0,
      		y: 0
      	},
      	startPosition: {
      		x: 0,
      		y: 0
      	},
        endPosition: {
          x: 0,
      		y: 0
        }
      }
    }
  },
  computed: {
    transformOrigin: function() {
      return `${this.transform.center.x}px ${this.transform.center.y}px`;
    },
    transformStyle: function () {
      return `matrix(${this.matrix.a}, ${this.matrix.b}, ${this.matrix.c}, ${this.matrix.d}, ${this.matrix.tx}, ${this.matrix.ty})`
    }
  },
  mounted () {
    this.pageResize();
    window.addEventListener('resize', this.pageResize());
    document.addEventListener('mouseup', this.onMoveEndOutside);
  },
  beforeDestroy () {
    document.body.style.overflow = 'auto';
    window.removeEventListener('resize', this.pageResize);
    document.removeEventListener('mouseup', this.onMoveEndOutside);
  },
  methods: {

    pageResize() {
      const areaRect = {
        size: {
          width: Number(this.$refs.area.offsetWidth),
          height: Number(this.$refs.area.offsetHeight)
        },
        center: {
          x: Number(this.$refs.area.offsetWidth)/2,
          y: Number(this.$refs.area.offsetHeight)/2
        }
      };
      this.$emit('resized', areaRect);
    },

    imageLoaded(event) {
      this.loading = false;
      const imageRect = {
        size: {
          width: Number(this.$refs.image.width),
          height: Number(this.$refs.image.height)
        },
        center: {
          x: Number(this.$refs.image.width)/2,
          y: Number(this.$refs.image.height)/2,
        }
      };
      this.$emit('loaded', imageRect);
    },

    onMoveStart(event) {
      if(event.type == 'touchstart' || window.innerWidth <= 480) document.body.style.overflow = 'hidden';
      const screenX = event.type == 'touchstart' ? event.changedTouches[0].screenX : event.screenX;
      const screenY = event.type == 'touchstart' ? event.changedTouches[0].screenY : event.screenY;
      this.m.moving = true;
      this.m.clickPosition = {
        x: screenX,
        y: screenY
      };
      this.m.startPosition = {x: this.transform.x, y: this.transform.y};
    },

    onMoveEndOutside(event){
      if(event.target.className.indexOf('edit-zone') > -1 || event.target.className.indexOf('frame') > -1 || !this.m.moving) return false;
      this.onMoveEnd();
    },

    onMoveEnd(event) {
      this.m.moving = false;
      document.body.style.overflow = 'auto';
      this.$emit('moved');
    },

    onMove(event) {
      const screenX = event.type == 'touchmove' ? event.changedTouches[0].screenX : event.screenX;
      const screenY = event.type == 'touchmove' ? event.changedTouches[0].screenY : event.screenY;
      if (this.m.moving) {
        this.transform.x = this.m.startPosition.x + (screenX - this.m.clickPosition.x);
        this.transform.y = this.m.startPosition.y + (screenY - this.m.clickPosition.y);
      }
    }
  }
}
</script>

<style lang="css">
.edit-zone {
  overflow: hidden;
}
.edit-zone:after {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-shadow: 0 0 0 1000px rgba(255,255,255,1);
}
.edit-zone img {

  position: absolute;
  top: 0;
  left: 0;

  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
  cursor: move;

  transform-origin: 0 0;
}
</style>
