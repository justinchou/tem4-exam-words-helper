import Head from "next/head";
import { useState } from "react";
import styles from "./index.module.css";

export default function Home() {
  const [newWords, setNewWords] = useState(20);
  const [result, setResult] = useState();
  const [picks, setPicks] = useState();
  const [dicts, setDicts] = useState();

  async function onSubmit(event) {
    event.preventDefault();
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newWords,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      const resultHtml =
        data.picks &&
        data.picks.reduce((prev, pick) => {
          return prev.replace(new RegExp(" " + pick + " ", "g"), ` <span class="tag"><b>${pick}</b></span> `);
        }, data.result);
      // console.log(resultHtml);

      setResult(resultHtml);
      setPicks(data.picks);
      setDicts(data.dicts);

      setNewWords(20);
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  return (
    <div>
      <Head>
        <title>TEM4 Passage Gen</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <img src="/dog.png" className={styles.icon} />
        <h3>Gen TEM4 Passage</h3>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="newWords"
            placeholder="Enter how many words to learn"
            value={newWords}
            onChange={(e) => setNewWords(e.target.value)}
          />
          <input type="submit" value="Generate A Passage" />
        </form>

        <div id={styles.content}>
          <div className={styles.result} dangerouslySetInnerHTML={{ __html: result }}></div>
        </div>

        <div id={styles.notes}>
          <div className={styles.tips}>
            <ul>
              {picks &&
                picks
                  .sort()
                  .filter((pick, i) => dicts[pick] && i < picks.length / 2)
                  .map((pick) => {
                    return (
                      <>
                        <li>
                          <b>{pick}</b>: {dicts[pick]}
                        </li>
                      </>
                    );
                  })}
            </ul>
          </div>

          <div className={styles.tips}>
            <ul>
              {picks &&
                picks
                  .sort()
                  .filter((pick, i) => dicts[pick] && i >= picks.length / 2)
                  .map((pick) => {
                    return (
                      <>
                        <li>
                          <b>{pick}</b>: {dicts[pick]}
                        </li>
                      </>
                    );
                  })}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
