
import { Bodies, Body, Composite, Composites, Constraint, Engine, Events, Render, Runner } from "matter-js";
import { Conf } from "../core/conf";
import { Func } from "../core/func";
import { Mouse } from "../core/mouse";
import { MyDisplay } from "../core/myDisplay";
import { Util } from "../libs/util";
import { Visual } from "./visual";

// -----------------------------------------
//
// -----------------------------------------
export class Contents extends MyDisplay {

  public engine:Engine;
  public render:Render;

  // マウス用
  private _mouse:Body;

  private _stack:Array<Composite> = [];

  // ビジュアル用
  private _v:Visual;

  constructor(opt:any) {
    super(opt)

    const sw = Func.instance.sw();
    const sh = Func.instance.sh();

    // エンジン
    this.engine = Engine.create();

    // 重力方向変える
    this.engine.gravity.x = 0;
    this.engine.gravity.y = 0;

    // レンダラー
    this.render = Render.create({
      element: document.body,
      engine: this.engine,
      options: {
        width: sw,
        height: sh,
        showAngleIndicator: false,
        showCollisions: false,
        showVelocity: false,
        pixelRatio:0.1
      }
    });
    this.render.canvas.classList.add('matter')

    for(let i = 0; i < Conf.instance.STACK_NUM; i++) {
      const rad = Util.instance.radian((360 / Conf.instance.STACK_NUM) * i);
      const radius = sw * 0.05;
      const x = sw * 0.5 + Math.sin(rad) * radius;
      const y = sh * 0.5 + Math.cos(rad) * radius;

      let group = Body.nextGroup(true);
      const stack = Composites.stack(x, y, Conf.instance.ITEM_NUM, 1, 0, 0, (x:any, y:any) => {
        return Bodies.rectangle(x, y, Conf.instance.ITEM_SIZE, Conf.instance.ITEM_SIZE, { collisionFilter: { group: group } });
      });

      Composites.chain(stack, 0.5, 0.5, 0, -0.5, { stiffness: 0.8, length: 2, render: { type: 'line' } });
      Composite.add(stack, Constraint.create({
          bodyB: stack.bodies[0],
          pointB: { x: 0, y: 0 },
          pointA: { x: stack.bodies[0].position.x, y: stack.bodies[0].position.y },
          stiffness: 0.8
      }));

      Composite.add(this.engine.world, [
        stack,
      ]);
      this._stack.push(stack);
    }

    // マウス
    this._mouse = Bodies.rectangle(0, 0, 100, 100, {isStatic:true});
    Composite.add(this.engine.world, [
      this._mouse,
    ]);

    // ビジュアル
    this._v = new Visual({
      el:this.getEl()
    })

    // run the renderer
    Render.run(this.render);

    // create runner
    const runner:Runner = Runner.create();

    // run the engine
    Runner.run(runner, this.engine);

    // 描画後イベント
    Events.on(this.render, 'afterRender', () => {
      this._eAfterRender();
    })



    this._resize();
  }


  private _eAfterRender(): void {
    // ビジュアル更新
    this._v.updatePos(this._stack);
  }



  protected _update(): void {
    super._update();

    const mx = Mouse.instance.x
    const my = Mouse.instance.y

    // マウス位置に合わせる
    Body.setPosition(this._mouse, {x:mx, y:my});

    // Body.setPosition(this._frame[0], this._p);
    // this._frame[0].position.y += 2;

  }


  protected _resize(): void {
    super._resize();

    const sw = Func.instance.sw();
    const sh = Func.instance.sh();

    this.render.canvas.width = sw;
    this.render.canvas.height = sh;
  }
}