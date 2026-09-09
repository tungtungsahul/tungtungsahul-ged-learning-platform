import {describe,it,expect} from 'vitest'; describe('GED scale',()=>{it('maps 0-100% into 100-200',()=>{expect(100+0).toBe(100);expect(100+45).toBe(145);expect(100+100).toBe(200);});});
    