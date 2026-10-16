# The Right Kind of Wrong: project page

Static site for *The Right Kind of Wrong: Counterfactual Data for Reward Learning in Manipulation*.
No build step: plain HTML, CSS and JS.

```
index.html      page structure
style.css       styling
app.js          source cards, RL results grid and charts, reward-curve player
data.js         RL success rates and the 25 benchmark clips with reward curves
media/          teaser, RL rollout loops, graded source clips, benchmark clips
data/           source CSVs behind data.js (reward_curves/: benchmark trajectories and progress predictions)
```

## Publish on GitHub Pages (user g0kul6)

1. Create an empty repository on GitHub named `counterfactual-study` (no README).
2. From this folder:
   ```
   git init
   git add .
   git commit -m "Project page"
   git branch -M main
   git remote add origin https://github.com/g0kul6/counterfactual-study.git
   git push -u origin main
   ```
3. On GitHub, open Settings → Pages, set Source to "Deploy from a branch", and choose `main` and `/ (root)`.
4. The site goes live at https://g0kul6.github.io/counterfactual-study/ within a minute or two.

To serve it at https://g0kul6.github.io/ instead, name the repository `g0kul6.github.io`. All paths are relative, so either works.

## Things to fill in

- **Links:** the Paper, arXiv and Code buttons in `index.html` point to `#`; replace the `href`s when you have them.
- **Benchmark clips:** all 25 are in `media/bench/`, encoded with a keyframe every half second so scrubbing stays smooth. To rebuild them from the original `offline_benchmark` videos, run `./make_benchmark_clips.sh /path/to/offline_benchmark`.

## Preview locally

```
python3 -m http.server 8000
```
Then open http://localhost:8000.
