"use client";
import axios from "axios";
import Image from "next/image";
import Select, { ActionMeta, MultiValue, OptionProps, SingleValue } from "react-select";
import { useEffect, useState } from "react";

type Presenter = {
  presenter_id: string;
  name: string;
  gender: string;
  thumbnail_url: string;
  talking_preview_url: string;
};


type OptionType = {
  value: string;
  label: string;
  data: Presenter;
};

interface Clip {
  id: string,
  result_url: string,
}
export default function Home() {
  //const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [options, setOptions] = useState<OptionType[]>([]);
  const [selected, setSelected] = useState<OptionType | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [authToken, setAuthToken] = useState("");

  const [inputText, setInputText] = useState("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<Clip | undefined>(undefined);
  const charLimit = 200;





  useEffect(() => {
    setIsClient(true);
    getPresenters();
  }, []);

  const getPresenters = async () => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/presenters`);
    const list: Presenter[] = response.data.presenters ?? [];
    //setPresenters(list);

    const formatted = list.map((p) => ({
      value: p.presenter_id,
      label: `${p.name} (${p.gender})`,
      data: p,
    }));
    setOptions(formatted);
  };

  const customSingleValue = ({ data }: { data: OptionType }) => (
    <div className="flex items-center gap-2">
      <Image
        src={data.data.thumbnail_url}
        alt={data.label}
        width={30}
        height={30}
        className="rounded-full"
      />
      <span className="font-medium text-gray-900">{data.label}</span>
    </div>
  );

  const customOption = (props: OptionProps<OptionType>) => {
    const { data, innerRef, innerProps } = props;

    return (
      <div
        ref={innerRef}
        {...innerProps}
        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
      >
        <Image
          src={data.data.thumbnail_url}
          alt={data.label}
          width={30}
          height={30}
          className="rounded-full"
        />
        <div>
          <div className="font-medium text-gray-900">{data.data.name}</div>
          <div className="text-sm text-gray-500">{data.data.gender}</div>
        </div>
      </div>
    );
  };

  const handleChange = (
    newValue: SingleValue<OptionType> | MultiValue<OptionType>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _actionMeta: ActionMeta<OptionType>
  ) => {
    if (!Array.isArray(newValue)) {
      setSelected(newValue as OptionType | null);
    }
  };


  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= charLimit) {
      setInputText(text);
    }
  };

  const handleSubmit = async () => {
    setGenerating(true);
    setError(null); // clear previous errors
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/generate-video`, {
        selected,
        inputText,
        authToken
      });

      const clipId = response?.data?.videoResponse?.id;
      if (!clipId) {
        throw new Error("No clip ID returned from API");
      }

      await fetchGeneratedClip(clipId);

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message || "Something went wrong");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleBack = async () => {
    setClip(undefined);
    setInputText('');
    setAuthToken('');
  }

  const fetchGeneratedClip = async (clip_id: string) => {
    let response;
    do {
      await new Promise(resolve => setTimeout(resolve, 10000));
      response = await fetchClipApi(clip_id);
    } while (!['rejected', 'error', 'done'].includes(response?.clip?.status));
    if (response?.clip?.status) {
      setClip(response?.clip);
    }
    setGenerating(false);
  }

  const fetchClipApi = async (clip_id: string) => {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_PATH}/api/generate-video`, {
      params: {
        clip_id
      }
    });

    return response?.data;
  }


  return (
    <div className="w-[700px] mx-auto mt-10 flex flex-col gap-6">
      {isClient && (
        <>
          {!clip && (
            <>
              <div className="flex items-start gap-8">
                <div className="flex-shrink-0 w-1/3">
                  <Select
                    options={options}
                    value={selected}
                    onChange={handleChange}
                    getOptionLabel={(e) => e.label}
                    components={{ SingleValue: customSingleValue, Option: customOption }}
                    placeholder="Select a presenter"
                  />
                </div>

                {selected && (
                  <div className="flex-grow w-2/3">
                    <video
                      key={selected.value}
                      src={selected.data.talking_preview_url}
                      controls
                      width="100%"
                      className="rounded-md shadow"
                      preload="metadata"
                    >
                      Sorry, your browser doesn&apos;t support embedded videos.
                    </video>
                  </div>
                )}
              </div>

              {selected && (
                <>
                  <textarea
                    className="mt-4 w-full p-3 border rounded-md resize-y"
                    rows={4}
                    placeholder="Enter text for the AI model to speak..."
                    value={inputText}
                    onChange={handleTextChange}
                  />
                  <div className="text-sm text-gray-500 mt-1 text-right">
                    {inputText.length} / {charLimit} characters
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <input
                      type="password"
                      placeholder="Enter auth token"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md w-1/3"
                    />

                    <button
                      onClick={handleSubmit}
                      disabled={!inputText.trim() || generating}
                      className={`px-4 py-2 w-2/3 rounded-md text-white font-medium flex items-center justify-center gap-2
      ${!inputText.trim() || generating
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"}
    `}
                    >
                      {generating ? (
                        <>
                          <span className="loader border-white"></span>
                          Generating...
                        </>
                      ) : (
                        "Submit"
                      )}
                    </button>
                  </div>

                </>
              )}
            </>
          )}

          {clip && (
            <div className="flex-grow w-2/3 flex flex-col gap-4">
              <button
                onClick={handleBack}
                className="self-start px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                ← Back
              </button>
              <video
                key={clip.id}
                src={clip.result_url}
                controls
                width="100%"
                className="rounded-md shadow"
                preload="metadata"
              >
                Sorry, your browser doesn&apos;t support embedded videos.
              </video>

              {/* Video text below the video */}
              <div className="p-3 bg-gray-100 rounded-md text-sm text-gray-700 whitespace-pre-wrap">
                {inputText}
              </div>

              <div className="p-3 rounded-md text-sm text-blue-700">
                Video URL:{" "}
                <a
                  href={clip.result_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-900"
                >
                  {clip.result_url}
                </a>
              </div>


            </div>
          )}
          {error && (
            <div className="mt-4 p-3 text-red-700 bg-red-100 rounded">
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
