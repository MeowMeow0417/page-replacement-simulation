'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Random request generator with locality
const generateRequests = (length) => {
  const base = Array.from({ length: Math.ceil(length / 3) }, (_, i) => (i % 10).toString());
  const requests = [];
  for (let i = 0; i < length; i++) {
    const r = Math.random();
    if (r < 0.7) {
      requests.push(base[Math.floor(Math.random() * base.length)]);
    } else {
      requests.push((Math.floor(Math.random() * 10)).toString());
    }
  }
  return requests;
};

// FIFO
const buildFIFOSteps = (requests, cacheSize) => {
  const steps = [];
  const cache = [];
  const cacheSet = new Set();
  for (const page of requests) {
    const hit = cacheSet.has(page);
    let evicted = null;
    if (!hit) {
      if (cache.length >= cacheSize) {
        evicted = cache.shift();
        cacheSet.delete(evicted);
      }
      cache.push(page);
      cacheSet.add(page);
    }
    steps.push({ cache: [...cache], current: page, hit, evicted });
  }
  return steps;
};

// LRU
const buildLRUSteps = (requests, cacheSize) => {
  const steps = [];
  const cache = [];
  const lastUsed = new Map();
  for (let i = 0; i < requests.length; i++) {
    const page = requests[i];
    const hit = cache.includes(page);
    let evicted = null;
    lastUsed.set(page, i);
    if (!hit) {
      if (cache.length >= cacheSize) {
        let lruPage = cache[0];
        let oldest = lastUsed.get(lruPage);
        for (const p of cache) {
          const used = lastUsed.get(p);
          if (used < oldest) {
            oldest = used;
            lruPage = p;
          }
        }
        cache.splice(cache.indexOf(lruPage), 1);
        evicted = lruPage;
      }
      cache.push(page);
    }
    steps.push({ cache: [...cache], current: page, hit, evicted });
  }
  return steps;
};

// OPT
const buildOPTSteps = (requests, cacheSize) => {
  const steps = [];
  const cache = [];
  for (let i = 0; i < requests.length; i++) {
    const page = requests[i];
    const hit = cache.includes(page);
    let evicted = null;
    if (!hit) {
      if (cache.length >= cacheSize) {
        let farthestPage = null;
        let farthestIndex = -1;
        for (const p of cache) {
          const nextIndex = requests.slice(i + 1).indexOf(p);
          const absoluteNextIndex = nextIndex === -1 ? Infinity : nextIndex + i + 1;
          if (absoluteNextIndex > farthestIndex) {
            farthestIndex = absoluteNextIndex;
            farthestPage = p;
          }
        }
        cache.splice(cache.indexOf(farthestPage), 1);
        evicted = farthestPage;
      }
      cache.push(page);
    }
    steps.push({ cache: [...cache], current: page, hit, evicted });
  }
  return steps;
};

// Cache visualizer
function CacheVisualizer({ step }) {
  return (
    <Card className="flex flex-row gap-2 p-6 border rounded-xl w-full justify-center text-center">
      <AnimatePresence>
        {step.evicted && (
          <motion.div
            key={`evicted-${step.evicted}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="px-4 py-2 rounded-full border text-sm font-medium bg-red-200 border-red-500 dark:text-black z-10"
          >
            {step.evicted}
          </motion.div>
        )}
        {step.cache.map((page) => (
          <motion.div
            key={page}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={`px-4 py-2 rounded-full border text-sm font-medium dark:text-black ${
              step.current === page && step.hit
                ? 'bg-green-300 border-green-500'
                : 'bg-gray-100 border-gray-300'
            }`}
          >
            {page}
          </motion.div>
        ))}
      </AnimatePresence>
    </Card>
  );
}

// Simulation Controls
function SimulationControls({ isPlaying, onPlay, onPause, onStep, onReset, speed, setSpeed }) {
  return (
    <Card className="w-full h-72">
      <CardHeader><CardTitle className="text-lg text-center">Controls</CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-6 p-6 pt-0">
        <div className="flex flex-col gap-2">
          <Label className="text-sm text-center">Speed</Label>
          <div className="flex items-center gap-2">
            <Slider
              min={0.2}
              max={2}
              step={0.1}
              value={[speed]}
              onValueChange={([val]) => setSpeed(val)}
              className="w-full"
            />
            <span className="text-sm w-8 text-right">{speed.toFixed(1)}x</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onStep} variant="outline">Step</Button>
          <Button onClick={isPlaying ? onPause : onPlay}>{isPlaying ? 'Pause' : 'Play'}</Button>
          <Button variant="destructive" onClick={onReset}>Reset</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Stats Dashboard
function StatsDashboard({ totalRequests, totalHits, totalFaults }) {
  return (
    <Card className="w-full">
      <CardHeader><CardTitle className="text-lg text-center">Statistics</CardTitle></CardHeader>
      <CardContent className="flex flex-row gap-4 p-6 text-center justify-center">
        <div>
          <div className="text-xs text-muted-foreground">Page Hits</div>
          <div className="font-bold text-xl text-green-500">{totalHits}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Page Faults</div>
          <div className="font-bold text-xl text-red-500">{totalFaults}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total Requests</div>
          <div className="font-bold text-xl">{totalRequests}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Component
function CacheSim() {
  const [cacheSize, setCacheSize] = useState(3);
  const [numRequests, setNumRequests] = useState(20);
  const [requests, setRequests] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [algorithm, setAlgorithm] = useState('FIFO');
  const intervalRef = useRef(null);

  // Generate and run simulation
  const runSimulation = () => {
    const reqs = generateRequests(numRequests);
    setRequests(reqs);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  // Build steps whenever input or algo changes (after requests are generated)
  useEffect(() => {
    if (requests.length === 0) return;
    let builtSteps = [];
    if (algorithm === 'FIFO') builtSteps = buildFIFOSteps(requests, cacheSize);
    else if (algorithm === 'LRU') builtSteps = buildLRUSteps(requests, cacheSize);
    else if (algorithm === 'OPT') builtSteps = buildOPTSteps(requests, cacheSize);
    setSteps(builtSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [algorithm, cacheSize, numRequests, requests]);

  // Play animation
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          clearInterval(intervalRef.current);
          setIsPlaying(false);
          return prev;
        });
      }, 1000 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps]);

  const totalRequests = currentStep + 1;
  const totalFaults = steps.slice(0, totalRequests).filter((s) => !s.hit).length;
  const totalHits = totalRequests - totalFaults;

  return (
    <section className="flex flex-col p-6 w-full mx-auto h-screen">
      <Label className="text-2xl font-bold mb-6 text-center">
        Page Replacement Simulator - {algorithm}
      </Label>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex flex-col gap-6 w-full md:max-w-sm">
          <aside className="border p-6 rounded-lg shadow-md flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Algorithm:</Label>
              <Select value={algorithm} onValueChange={(val) => setAlgorithm(val)}>
                <SelectTrigger><SelectValue placeholder="Select an algorithm" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIFO">FIFO</SelectItem>
                  <SelectItem value="LRU">LRU</SelectItem>
                  <SelectItem value="OPT">OPT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Cache Size:</Label>
              <Input
                type="number"
                value={cacheSize}
                min={1}
                max={10}
                onChange={(e) => setCacheSize(parseInt(e.target.value))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm"># of Requests:</Label>
              <Input
                type="number"
                value={numRequests}
                min={1}
                max={50}
                onChange={(e) => setNumRequests(parseInt(e.target.value))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={runSimulation} className="w-full">
                🎲 Generate Requests
              </Button>
            </div>
          </aside>
          {steps.length > 0 && (
            <SimulationControls
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onStep={() => setCurrentStep((s) => Math.min(s + 1, steps.length - 1))}
              onReset={() => setCurrentStep(0)}
              speed={speed}
              setSpeed={setSpeed}
            />
          )}
        </div>

        <div className="flex flex-col flex-1 gap-6 sm:pb-24">
          {requests.length > 0 ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Page Reference String</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2 justify-center p-4 py-0">
                {requests.map((page, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 border rounded text-sm dark:text-black">
                    {page}
                  </span>
                ))}
              </CardContent>
            </Card>
          ) : (
            <section className="flex flex-row justify-center items-center min-h-full">
              <Label>Click Generate Requests to start simulation.</Label>
            </section>
          )}

          {steps.length > 0 && (
            <div className="flex flex-col items-center">
              <Label className="text-xl mb-2">
                Current Request: <span className="font-bold">{steps[currentStep]?.current}</span>
              </Label>
              <CacheVisualizer step={steps[currentStep]} />
            </div>
          )}

          {steps.length > 0 && (
            <StatsDashboard
              totalRequests={totalRequests}
              totalHits={totalHits}
              totalFaults={totalFaults}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default CacheSim;
