import { fabric } from 'fabric';
import CanvasHistory from './canvasHistory';

export default (function () {
  let drag;
  let shape;
  let color;
  let lineWidth, fillCircle, angle, shapeId;
  let strokeDashArray;
  let borderRadius;
  let properties;
  let isDown = false;

  function Shape(canvas, draggable = false, type, params) {
    if (!draggable) {
      drag = false;
      return Shape;
    }
    if (color && color !== params.stroke) {
      color = params.stroke;
      shape = type;
      new Shape(canvas, true, shape, params);
      return Shape;
    }
    if (shape && shape !== type) {
      shape = type;
      drag = true;
      new Shape(canvas, true, shape, params);
      return Shape;
    }
    properties = params;
    if (properties) {
      fillCircle = properties.fill;
      color = properties.stroke;
      lineWidth = properties.strokeWidth;
      angle = properties.angle;
      strokeDashArray = properties.strokeDashArray;
      borderRadius = properties.borderRadius;
      shapeId = properties.id;
    }
    this.canvas = canvas;
    this.className = 'Shape';
    this.isDrawing = false;
    this.origX = 0;
    this.origY = 0;

    drag = draggable;
    shape = type;

    this.bindEvents();
  }

  Shape.prototype.bindEvents = function () {
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
  Shape.prototype.onMouseUp = function () {
    isDown = false;
    let inst = this;
    if (!inst.isEnable()) {
      return;
    }
    if (drag) {
      inst.canvas.getObjects().forEach(function (object, index, array) {
        if (index === array.length - 1) {
          if (
            inst.canvas.getActiveObject() &&
            inst.canvas.getActiveObject()._objects &&
            inst.canvas.getActiveObject()._objects.length > 1
          ) {
            inst.canvas.setActiveObject(object);
          }
        }
      });
      if (inst.canvas.getActiveObject()) {
        inst.canvas.getActiveObject().hasControls = false;
        inst.canvas.getActiveObject().hasBorders = false;
        inst.canvas.getActiveObject().lockMovementX = true;
        inst.canvas.getActiveObject().lockMovementY = true;
        inst.canvas.getActiveObject().lockUniScaling = true;
      }
      inst.canvas.renderAll();
    }
    let canvasProperties = { width: inst.canvas.width, height: inst.canvas.height };
    let currentCanvas = { json: inst.canvas.toJSON(), canvas: canvasProperties };
    new CanvasHistory(inst.canvas, currentCanvas);
    inst.disable();
  };
  Shape.prototype.onMouseMove = function (o) {
    let inst = this;
    if (!inst.isEnable()) {
      return;
    }
    inst.canvas.selection = false;
    let pointer = inst.canvas.getPointer(o.e);
    let activeObj;
    if (inst.canvas.getActiveObject()) {
      activeObj = inst.canvas.getActiveObject();
      activeObj.stroke = color;
      activeObj.strokeWidth = lineWidth;
      activeObj.id = shapeId;
      activeObj.fill = fillCircle;
      activeObj.noScaleCache = false;
      activeObj.strokeUniform = true;
    }

    if (this.origX > pointer.x) {
      activeObj.set({
        right: Math.abs(pointer.x),
        originX: 'right',
      });
    } else {
      activeObj.set({
        originX: 'left',
      });
    }

    if (this.origY > pointer.y) {
      activeObj.set({
        bottom: Math.abs(pointer.y),
        originY: 'bottom',
      });
    } else {
      activeObj.set({
        originY: 'top',
      });
    }

    if (shape == 'rect') {
      activeObj.set({
        width: Math.abs(this.origX - pointer.x),
        height: Math.abs(this.origY - pointer.y),
      });
    }
    if (shape == 'vector') {
      activeObj.scaleToHeight(Math.abs(this.origY - pointer.y));
    }
    if (shape == 'line') {
      if (!isDown) return;
      activeObj.set({ x2: pointer.x, y2: pointer.y });
    }
    if (shape == 'circle') {
      activeObj.set({
        rx: Math.abs(this.origX - pointer.x) / 2,
        ry: Math.abs(this.origY - pointer.y) / 2,
      });
    }
    activeObj.setCoords();
    inst.canvas.renderAll();
  };

  Shape.prototype.onMouseDown = function (o) {
    isDown = true;
    let inst = this;
    if (!drag) {
      if (inst.canvas.getActiveObject()) {
        inst.canvas.getActiveObject().hasControls = shape === 'line' ? false : true;
        inst.canvas.getActiveObject().hasBorders = shape === 'line' ? false : true;
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
    this.origX = pointer.x;
    this.origY = pointer.y;
    if (shape === 'rect') {
      let rect = new fabric.Rect({
        left: this.origX,
        top: this.origY,
        originX: 'left',
        originY: 'top',
        width: pointer.x - this.origX,
        height: pointer.y - this.origY,
        angle: angle,
        fill: fillCircle,
        transparentCorners: false,
        stroke: color,
        strokeWidth: lineWidth,
        strokeDashArray: strokeDashArray,
        rx: 0,
        ry: 0,
        id: shapeId,
      });
      inst.canvas.add(rect).setActiveObject(rect);
    }
    if (shape === 'vector') {
      fabric.loadSVGFromString(properties.svgString, (objects) => {
        var obj = fabric.util.groupSVGElements(objects, {
          left: this.origX,
          top: this.origY,
          originX: 'left',
          originY: 'top',
          angle: angle,
          transparentCorners: false,
          id: shapeId,
          fill: 'red',
          strokeWidth: 20,
        });

        obj.set({
          strokeWidth: 8,
          stroke: 'rgb(255,0,0)',
        });

        obj.scaleToHeight(0);
        obj.setCoords();
        inst.canvas.add(obj).setActiveObject(obj);
      });
    }
    if (shape === 'circle') {
      let circle = new fabric.Ellipse({
        top: this.origY,
        left: this.origX,
        rx: 0,
        ry: 0,
        transparentCorners: false,
        hasBorders: true,
        hasControls: true,
        fill: fillCircle,
        stroke: color,
        strokeWidth: lineWidth,
        strokeDashArray: strokeDashArray,
        id: shapeId,
      });
      inst.canvas.add(circle).setActiveObject(circle);
    }
    if (shape === 'line') {
      var points = [pointer.x, pointer.y, pointer.x, pointer.y];
      let line = new fabric.Line(points, {
        strokeDashArray: strokeDashArray,
        stroke: fillCircle,
        originX: 'center',
        originY: 'center',
        angle: angle,
        transparentCorners: false,
        hasBorders: false,
        hasControls: false,
      });
      inst.canvas.add(line).setActiveObject(line);
    }
  };
  Shape.prototype.isEnable = function () {
    return this.isDrawing;
  };

  Shape.prototype.enable = function () {
    this.isDrawing = true;
  };

  Shape.prototype.disable = function () {
    this.isDrawing = false;
  };
  return Shape;
})();
