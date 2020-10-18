import { fabric } from 'fabric';
import CanvasHistory from './canvasHistory';

export default (function () {
  let drag;
  let color;
  let lineWidth;
  let strokeDashArray;
  let properties;
  let isDown = false;

  function CustomShape(canvas, draggable = false, params) {
    if (!draggable) {
      drag = false;
      return CustomShape;
    }

    if (color && color !== params.stroke) {
      color = params.stroke;
      new CustomShape(canvas, draggable, params);
      return CustomShape;
    }

    properties = params;
    if (properties) {
      fillArrow = params.fill;
      color = params.stroke;
      lineWidth = params.strokeWidth;
      strokeDashArray = params.strokeDashArray;
      arrowId = params.id;
    }
    this.canvas = canvas;
    this.className = 'CustomShape';
    this.isDrawing = false;
    this.bindEvents();
    drag = draggable;
  }

  CustomShape.prototype.bindEvents = function () {
    let inst = this;
    document.onkeydown = (e) => {
      if (e.which === 46 || e.keycode === 46) {
        inst.canvas.getActiveObjects().forEach((obj) => {
          inst.canvas.remove(obj);
        });
      }
      inst.canvas.renderAll();
    };
    inst.selectable = true;

    inst.canvas.off('mouse:down');
    inst.canvas.on('mouse:down', function (o) {
      inst.onMouseDown(o);
    });
    inst.canvas.on('mouse:move', function (o) {
      inst.onMouseMove(o);
    });
    inst.canvas.on('mouse:up', function (o) {
      inst.onMouseUp(o);
    });
    inst.canvas.on('object:moving', function () {
      inst.disable();
    });
  };
  CustomShape.prototype.onMouseUp = function () {
    let inst = this;
    if (!inst.isEnable()) {
      return;
    }
    if (drag) {
      this.line.set({
        dirty: true,
        objectCaching: true,
      });
      if (inst.canvas.getActiveObject()) {
        inst.canvas.getActiveObject().hasControls = false;
        inst.canvas.getActiveObject().hasBorders = false;
        inst.canvas.getActiveObject().lockMovementX = true;
        inst.canvas.getActiveObject().lockMovementY = true;
        inst.canvas.getActiveObject().lockUniScaling = true;
      }
      inst.canvas.renderAll();
      let canvasProperties = { width: inst.canvas.width, height: inst.canvas.height };
      let currentCanvas = { json: inst.canvas.toJSON(), canvas: canvasProperties };
      new CanvasHistory(inst.canvas, currentCanvas);
    }
    inst.disable();
  };
  CustomShape.prototype.onMouseMove = function (o) {
    let inst = this;
    inst.canvas.selection = false;
    if (!inst.isEnable()) {
      return;
    }
    let pointer = inst.canvas.getPointer(o.e);
    let activeObj = inst.canvas.getActiveObject();
    activeObj.set({
      x2: pointer.x,
      y2: pointer.y,
    });
    activeObj.setCoords();
    inst.canvas.renderAll();
  };

  CustomShape.prototype.onMouseDown = function (o) {
    let inst = this;
    if (!drag) {
      if (inst.canvas.getActiveObject()) {
        inst.canvas.getActiveObject().hasControls = true;
        inst.canvas.getActiveObject().hasBorders = true;
        inst.canvas.getActiveObject().lockMovementX = false;
        inst.canvas.getActiveObject().lockMovementY = false;
        inst.canvas.getActiveObject().lockUniScaling = false;
        inst.canvas.renderAll();
      }
      inst.disable();
      return;
    }
    inst.enable();
    if (inst.canvas.getActiveObject()) {
      inst.canvas.getActiveObject().hasControls = false;
      inst.canvas.getActiveObject().hasBorders = false;
      inst.canvas.getActiveObject().lockMovementX = true;
      inst.canvas.getActiveObject().lockMovementY = true;
      inst.canvas.getActiveObject().lockUniScaling = true;
      inst.canvas.renderAll();
    }
    let pointer = inst.canvas.getPointer(o.e);
    let points = [pointer.x, pointer.y, pointer.x, pointer.y];
    this.line = new fabric.Line(points, {
      strokeWidth: lineWidth,
      strokeDashArray: strokeDashArray,
      fill: color,
      stroke: color,
      originX: 'center',
      originY: 'center',
      hasBorders: false,
      hasControls: false,
      objectCaching: false,
      perPixelTargetFind: true,
      heads: [1, 0],
      id: arrowId ? arrowId : 'customShape',
    });
    inst.canvas.add(this.line).setActiveObject(this.line);
  };

  CustomShape.prototype.isEnable = function () {
    return this.isDrawing;
  };

  CustomShape.prototype.enable = function () {
    this.isDrawing = true;
  };

  CustomShape.prototype.disable = function () {
    this.isDrawing = false;
  };

  return CustomShape;
})();
