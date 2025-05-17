'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import {
  Card, CardHeader, CardTitle, CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input';

/**
 * Generate a sequence of page requests simulating realistic access patterns.
 * - Mostly requests come from a small base set (70% chance).
 * - Occasionally random pages are requested (30% chance).
 *
 * @param length Number of requests to generate
 * @returns Array of string page requests (e.g., ["0","1","2",...])
 */
const generateRequests = (length) => {
  const base = Array.from({ length: Math.ceil(length / 3) }, (_, i) => (i % 10).toString());
  const requests = [];
  for (let i = 0; i < length; i++) {
    const r = Math.random();
    if (r < 0.7) {
      // 70%: pick from base pattern
      requests.push(base[Math.floor(Math.random() * base.length)]);
    } else {
      // 30%: pick any random page 0-9
      requests.push((Math.floor(Math.random() * 10)).toString());
    }
  }
  return requests;
};

/**
 * FIFO Page Replacement Algorithm Implementation.
 * Uses a queue to track the pages in cache.
 * Evicts the oldest page on cache miss when full.
 *
 * @param requests Array of requested pages
 * @param cacheSize Size of cache
 * @returns Array of step objects representing cache state after each request
 */
const buildFIFOSteps = (requests, cacheSize) => {
  const steps = [];
  const cache = [];
  const cacheSet = new Set();

  for (const page of requests) {
    const hit = cacheSet.has(page); // Check if page in cache
    let evicted = null;

    if (!hit) {
      if (cache.length >= cacheSize) {
        evicted = cache.shift(); // Remove oldest page (FIFO)
        cacheSet.delete(evicted);
      }
      cache.push(page);
      cacheSet.add(page);
    }

    // Record step: current cache state, current page, hit or miss, evicted page
    steps.push({ cache: [...cache], current: page, hit, evicted });
  }

  return steps;
};

/**
 * LRU (Least Recently Used) Page Replacement Algorithm.
 * Tracks last used index of each page.
 * Evicts page with oldest last use on miss when cache is full.
 *
 * @param requests Array of page requests
 * @param cacheSize Cache size
 * @returns Array of step objects
 */
const buildLRUSteps = (requests, cacheSize) => {
  const steps = [];
  const cache = [];
  const lastUsed = new Map();

  for (let i = 0; i < requests.length; i++) {
    const page = requests[i];
    const hit = cache.includes(page);
    let evicted = null;

    if (!hit) {
      if (cache.length >= cacheSize) {
        // Find LRU page in cache (lowest lastUsed index)
        let lruPage = cache[0];
        let oldest = lastUsed.get(lruPage) ?? 0;
        for (const p of cache) {
          if ((lastUsed.get(p) ?? 0) < oldest) {
            oldest = lastUsed.get(p);
            lruPage = p;
          }
        }
        cache.splice(cache.indexOf(lruPage), 1);
        evicted = lruPage;
      }
      cache.push(page);
    }

    // Update last used index for current page
    lastUsed.set(page, i);

    steps.push({ cache: [...cache], current: page, hit, evicted });
  }

  return steps;
};

/**
 * OPT (Optimal) Page Replacement Algorithm.
 * Evicts the page which will not be used for the longest future duration.
 *
 * @param requests Array of page requests
 * @param cacheSize Cache size
 * @returns Array of step objects
 */
const buildOPTSteps = (requests, cacheSize) => {
  const steps = [];
  const cache = [];

  for (let i = 0; i < requests.length; i++) {
    const page = requests[i];
    const hit = cache.includes(page);
    let evicted = null;

    if (!hit) {
      if (cache.length >= cacheSize) {
        let farthestPage = '';
        let farthestIndex = -1;
        for (const p of cache) {
          // Find next use of page in future requests
          const nextUse = requests.slice(i + 1).indexOf(p);
          if (nextUse === -1) {
            // If page not used again, evict immediately
            farthestPage = p;
            break;
          } else if (nextUse > farthestIndex) {
            // Otherwise evict page with farthest future use
            farthestIndex = nextUse;
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

/**
 * Component to visualize current cache state with animation.
 * Highlights hits in green, evicted pages in red.
 *
 * @param step Current step data (cache array, current page, hit, evicted)
 * @returns JSX Element
 */
function CacheVisualizer({ step }) {
  return (
    <Card className="flex gap-2 p-6 border rounded-xl w-full justify-center flex-row text-center">
      <AnimatePresence>
        {/* Evicted Page */}
        {step.evicted && (
          <motion.div
            key={`evicted-${step.evicted}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 bg-red-200 border-red-500 dark:text-black z-10"
          >
            {step.evicted}
          </motion.div>
        )}

        {/* Cache Pages */}
        {step.cache.map((page) => (
          <motion.div
            key={page}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-300 dark:text-black
              ${step.current === page && step.hit ? 'bg-green-300 border-green-500' :
                'bg-gray-100 border-gray-300'}
            `}
          >
            {page}
          </motion.div>
        ))}
      </AnimatePresence>
    </Card>
  );
}

/**
 * Controls component for play/pause, stepping, resetting, and speed slider.
 *
 * @param isPlaying Boolean play state
 * @param onPlay Function to trigger play
 * @param onPause Function to trigger pause
 * @param onStep Function to advance one step
 * @param onReset Function to reset simulation
 * @param speed Current speed multiplier
 * @param setSpeed Setter for speed
 * @returns JSX element
 */
function SimulationControls({ isPlaying, onPlay, onPause, onStep, onReset, speed, setSpeed }) {
  return (
    <Card className="w-full h-72">
      <CardHeader className='gap-0'>
        <CardTitle className="text-lg text-center">Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 p-6 pt-0">

        {/* Speed Slider */}
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

        {/* Buttons: Step, Play/Pause, Reset */}
        <div className="flex flex-col gap-2">
          <Button onClick={onStep} variant="outline">Step</Button>
          <Button onClick={isPlaying ? onPause : onPlay}>
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button variant="destructive" onClick={onReset}>Reset</Button>
        </div>

      </CardContent>
    </Card>
  );
}

/**
 * Displays statistics of the simulation:
 * - Total requests processed
 * - Total page hits
 * - Total page faults
 *
 * @param totalRequests Number of requests processed so far
 * @param totalHits Number of cache hits
 * @param totalFaults Number of cache misses (faults)
 * @returns JSX element
 */
function StatsDashboard({ totalRequests, totalHits, totalFaults }) {
  return (
    <Card className="w-full ">
      <CardHeader className='gap-0'>
        <CardTitle className="text-lg text-center">Statistics</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-row gap-4 p-6 text-center py-0 justify-center">

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

/**
 * Main Cache Simulator Component.
 * Handles user input, runs selected algorithm, controls playback, and renders UI.
 */
function CacheSim() {
  // Cache size in number of pages (default 3)
  const [cacheSize, setCacheSize] = useState(3);
  // Number of page requests to generate (default 20)
  const [numRequests, setNumRequests] = useState(20);
  // Generated page reference string (array of pages)
  const [requests, setRequests] = useState([]);
  // Array of steps generated by the selected algorithm
  const [steps, setSteps] = useState([]);
  // Current simulation step index
  const [currentStep, setCurrentStep] = useState(0);
  // Play/pause state for animation
  const [isPlaying, setIsPlaying] = useState(false);
  // Playback speed multiplier
  const [speed, setSpeed] = useState(1);
  // Selected page replacement algorithm
  const [algorithm, setAlgorithm] = useState('FIFO');

  // Ref for interval ID used in playback
  const intervalRef = useRef(null);

  /**
   * Generates new page requests and runs the selected algorithm to build simulation steps.
   * Resets simulation state and pauses playback.
   */
  const runSimulation = () => {
    const reqs = generateRequests(numRequests);
    let builtSteps = [];

    switch (algorithm) {
      case 'FIFO':
        builtSteps = buildFIFOSteps(reqs, cacheSize);
        break;
      case 'LRU':
        builtSteps = buildLRUSteps(reqs, cacheSize);
        break;
      case 'OPT':
        builtSteps = buildOPTSteps(reqs, cacheSize);
        break;
      default:
        builtSteps = buildFIFOSteps(reqs, cacheSize);
    }

    setRequests(reqs);
    setSteps(builtSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  };

  /**
   * Advances simulation one step.
   * Stops playing if at the end.
   */
  const stepForward = () => {
    setCurrentStep((step) => {
      if (step + 1 >= steps.length) {
        setIsPlaying(false);
        return step;
      }
      return step + 1;
    });
  };

  /**
   * Handles starting playback with the current speed.
   */
  const play = () => {
    setIsPlaying(true);
  };

  /**
   * Handles pausing playback.
   */
  const pause = () => {
    setIsPlaying(false);
  };

  /**
   * Resets simulation by rerunning with current settings.
   */
  const reset = () => {
    runSimulation();
  };

  /**
   * Effect: on playing state, starts interval to step forward automatically.
   * Clears interval on pause or unmount.
   */
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((step) => {
          if (step + 1 >= steps.length) {
            setIsPlaying(false);
            clearInterval(intervalRef.current);
            return step;
          }
          return step + 1;
        });
      }, 1000 / speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  // Compute stats: count hits and faults up to currentStep
  const totalHits = steps.slice(0, currentStep + 1).filter(s => s.hit).length;
  const totalFaults = (currentStep + 1) - totalHits;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="mb-4 text-2xl font-semibold text-center">Page Replacement Cache Simulator</h1>

      {/* Algorithm Selection */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Select value={algorithm} onValueChange={setAlgorithm} className="max-w-xs">
          <SelectTrigger>
            <SelectValue placeholder="Select Algorithm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FIFO">FIFO (First-In-First-Out)</SelectItem>
            <SelectItem value="LRU">LRU (Least Recently Used)</SelectItem>
            <SelectItem value="OPT">OPT (Optimal)</SelectItem>
          </SelectContent>
        </Select>

        {/* Cache Size Input */}
        <div className="flex flex-col items-center">
          <Label htmlFor="cacheSize">Cache Size</Label>
          <Input
            id="cacheSize"
            type="number"
            min={1}
            max={10}
            value={cacheSize}
            onChange={(e) => setCacheSize(Math.max(1, Math.min(10, Number(e.target.value))))}
            className="max-w-[100px]"
          />
        </div>

        {/* Number of Requests Input */}
        <div className="flex flex-col items-center">
          <Label htmlFor="numRequests">Number of Requests</Label>
          <Input
            id="numRequests"
            type="number"
            min={5}
            max={100}
            value={numRequests}
            onChange={(e) => setNumRequests(Math.max(5, Math.min(100, Number(e.target.value))))}
            className="max-w-[100px]"
          />
        </div>

        <Button onClick={runSimulation} className="h-10 self-end">Run Simulation</Button>
      </div>

      {/* Show current request */}
      <div className="mb-4 text-center text-lg">
        {steps.length > 0 && currentStep < steps.length
          ? `Current Page Request: ${steps[currentStep].current} (${steps[currentStep].hit ? 'Hit' : 'Miss'})`
          : 'Run a simulation to see cache states'}
      </div>

      {/* Cache Visualization */}
      {steps.length > 0 && currentStep < steps.length && (
        <CacheVisualizer step={steps[currentStep]} />
      )}

      {/* Controls and Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <SimulationControls
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onStep={stepForward}
          onReset={reset}
          speed={speed}
          setSpeed={setSpeed}
        />
        <StatsDashboard
          totalRequests={currentStep + 1}
          totalHits={totalHits}
          totalFaults={totalFaults}
        />
      </div>
    </div>
  );
}

export default CacheSim;
